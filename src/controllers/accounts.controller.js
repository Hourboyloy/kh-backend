const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cloudinary = require("../cloud/connectionCloadinary");
const accounts = require("../models/accounts.model");
const products = require("../models/products.model");
const profiles = require("../models/profiles.model");
const mongoose = require("mongoose");

const viewsAccount = async (req, res) => {
  try {
    const username = req.params.username;
    const account = await accounts.findOne({ username });

    if (!account)
      return res.status(404).json({ message: "Account not found!" });
    const profile = await profiles.findOne({ accID: account._id });
    const productsResponce = await products
      .find({ accID: account._id })
      .sort({ updatedAt: -1 })
      .limit(12);
    const accountResponse = { ...account._doc };
    delete accountResponse.password;
    res.status(200).json({
      message: "Get account successfuly",
      account: accountResponse,
      profile,
      products: productsResponce || [],
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Error", error: err });
  }
};

const getMoreProducts = async (req, res) => {
  try {
    const accID = req.params.accID;
    if (accID === "undefined")
      return res.status(400).json({ message: "Id account not found!" });

    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const productsResponce = await products
      .find({ accID })
      .skip(skip)
      .sort({ updatedAt: -1 })
      .limit(limit);

    res.json({ products: productsResponce });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const register = async (req, res) => {
  try {
    const { firstName, lastName, phoneNum, password, comfirmPw } = req.body;

    if (!firstName) return res.json({ message: "First name is required" });
    if (!lastName) return res.json({ message: "Last name is required" });
    if (!phoneNum) return res.json({ message: "Phone number is required" });
    if (!password) return res.json({ message: "Password is required" });
    if (!comfirmPw)
      return res.json({ message: "Confirm password is required" });
    if (password !== comfirmPw)
      return res.json({
        message: "Password and Confirm password do not match",
      });

    // Check if phone number already exists
    const existingAccount = await accounts.findOne({ phoneNum });
    if (existingAccount)
      return res.json({ message: "Phone number already exists" });

    // Generate base username
    let username =
      firstName.toLowerCase().replace(/\s+/g, "") +
      lastName.toLowerCase().replace(/\s+/g, "");

    // Try finding unique username by adding random number if necessary
    let attemptCount = 0;
    let uniqueUsername = username;
    while (attemptCount < 5) {
      const existingUsername = await accounts.findOne({
        username: uniqueUsername,
      });
      if (!existingUsername) break;

      const randomNumber = Math.floor(Math.random() * 9000) + 1000;
      uniqueUsername = username + randomNumber;
      attemptCount++;
    }
    if (attemptCount === 5) {
      return res.json({
        message: "Please enter a different first name and last name",
      });
    }
    const hashPw = await bcrypt.hash(password, 10);
    const account = new accounts({
      username: uniqueUsername,
      phoneNum,
      password: hashPw,
    });

    const resAcc = await account.save();
    if (!resAcc) return res.json({ message: "Account registration failed" });
    const profile = new profiles({
      firstName,
      lastName,
      username,
      accID: resAcc._id,
    });

    const dataProfile = await profile.save();
    const accountResponse = { ...resAcc._doc };
    delete accountResponse.password;
    const access_token = jwt.sign(
      { accID: resAcc._id },
      process.env.USER_TOKEN,
      { expiresIn: "7d" }
    );
    res.json({
      message: "Account registered successfully",
      account: accountResponse,
      profile: dataProfile,
      access_token,
    });
  } catch (error) {
    console.log(error);
    res.json({ message: "Error", error });
  }
};

const login = async (req, res) => {
  try {
    const { phoneNum, password } = req.body;

    // Validate input
    if (!phoneNum) return res.json({ message: "Phone number is required" });
    if (!password) return res.json({ message: "Password is required" });

    // Find account by phone number
    const account = await accounts.findOne({ phoneNum });
    if (!account) return res.json({ message: "Account not found" });

    // Verify password
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) return res.json({ message: "Incorrect password" });

    const profile = await profiles.findOne({ accID: account._id });

    // Prepare response data without password
    const accountResponse = { ...account._doc };
    delete accountResponse.password;

    // Generate token based on account type
    const access_token = jwt.sign(
      { accID: account._id, type: account.type },
      process.env[
        account.type === process.env.TYPE ? "MANAGER_TOKEN" : "USER_TOKEN"
      ],
      { expiresIn: "7day" }
    );

    // Send response
    res.json({
      message: "Login successful",
      account: accountResponse,
      profile,
      access_token,
    });
  } catch (error) {
    console.log(error);
    res.json({ message: "Error", error });
  }
};

const removeAccount = async (req, res) => {
  try {
    const { accID } = req.params;

    if (!accID) {
      return res.status(400).json({ message: "Account id is required" });
    }

    // Clean accID to remove non-visible characters
    const cleanAccID = accID.replace(/[^\x20-\x7E]/g, "").trim();

    // Validate accID as a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(cleanAccID)) {
      return res.status(400).json({ message: "Invalid Account ID" });
    }

    // Use Promise.all to run operations in parallel
    const [account, profile] = await Promise.all([
      accounts.findByIdAndDelete(cleanAccID),
      profiles.findOne({ accID: cleanAccID }),
    ]);

    if (!account) {
      return res
        .status(404)
        .json({ message: "Account not found or already removed" });
    }

    if (profile) {
      const cloudinaryTasks = [];

      if (profile.profileCloudId) {
        cloudinaryTasks.push(
          cloudinary.uploader.destroy(profile.profileCloudId)
        );
      }
      if (profile.coverCloudId) {
        cloudinaryTasks.push(cloudinary.uploader.destroy(profile.coverCloudId));
      }

      // Wait for all cloudinary destroy tasks to finish
      if (cloudinaryTasks.length > 0) {
        await Promise.all(cloudinaryTasks);
      }
      // Remove profile
      await profiles.findOneAndDelete({ accID: cleanAccID });
    }

    res.status(200).json({ message: "Account removed successfully" });
  } catch (error) {
    console.error("Error while removing account:", error);
    res
      .status(500)
      .json({ message: "Error occurred while removing the account", error });
  }
};

const updateAccountFields = async (req, res) => {
  try {
    const { updates } = req.body;
    const { accID } = req.params;

    if (!accID) return res.status(400).json({ message: "User ID is required" });
    if (!updates || typeof updates !== "object")
      return res
        .status(400)
        .json({ message: "Updates must be provided as an object" });

    const updateFields = {};
    let updatedProfile = null;

    // Check for username if provided in updates

    if (updates.username) {
      const existingUsernameInAccounts = await accounts.findOne({
        username: updates.username,
        _id: { $ne: accID },
      });
      if (existingUsernameInAccounts) {
        return res.json({ message: "Username already exists" });
      }

      await products.updateMany(
        { accID: accID },
        { $set: { username: updates.username } }
      );
      updateFields.username = updates.username;
      updatedProfile = await profiles.updateOne(
        { accID: accID },
        { $set: { username: updates.username } }
      );
    }

    // Check for phone number if provided in updates
    if (updates.phoneNum) {
      const existingPhoneNum = await accounts.findOne({
        phoneNum: updates.phoneNum,
        _id: { $ne: accID },
      });
      if (existingPhoneNum) {
        return res.json({ message: "Phone number already exists" });
      }
      updateFields.phoneNum = updates.phoneNum;
    }

    // Check for password if provided in updates
    if (updates.password) {
      const hashPw = await bcrypt.hash(updates.password, 10);
      updateFields.password = hashPw;
    }

    // Update other fields
    Object.keys(updates).forEach((key) => {
      if (!["username", "password", "phoneNum"].includes(key)) {
        updateFields[key] = updates[key];
      }
    });

    // Perform the update
    const updatedAccount = await accounts.findByIdAndUpdate(
      accID,
      { $set: updateFields },
      { new: true } // Returns the modified document
    );

    if (!updatedAccount) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Prepare the response data (remove sensitive data like password)
    const accountResponse = { ...updatedAccount._doc };
    delete accountResponse.password;

    const response = {
      message: "Account updated successfully",
      account: accountResponse,
    };
    if (updatedProfile) {
      const profile = await profiles.findOne({ accID: accID });
      response.profile = profile;
    }

    // Send the response
    res.json(response);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error occurred while updating the account", error });
  }
};

const getAccountLimit = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const responce = await accounts.find().skip(skip).limit(limit);
    if (!responce || responce.length === 0) {
      return res.json({ message: "No accounts found", accounts: [] });
    }
    const totalCount = await accounts.countDocuments();
    res.json({
      accounts: responce,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({
      message: "Error fetching accounts",
      error,
    });
  }
};

const getAccount = async (req, res) => {
  try {
    const { username, phoneNum } = req.params;
    const account = await accounts.findOne({ username, phoneNum });
    if (!account) return res.json({ message: "Can't access this account" });
    const profile = await profiles.findOne({ accID: account._id });
    if (!profile) return res.json({ message: "Can't access this profile" });

    res.json({ message: "Get successfuly", account, profile });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getMoreProducts,
  viewsAccount,
  register,
  login,
  removeAccount,
  updateAccountFields,
  getAccountLimit,
  getAccount,
};
