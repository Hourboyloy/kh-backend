const addressModel = require("../models/address.model");

const create = async (req, res) => {
  try {
    const { accID } = req.params;
    const {
      name,
      phoneNum,
      address,
      saveAs,
      locations,
      company,
      mail,
      taxID,
      setAsDefault,
    } = req.body;

    if (!accID) return res.json({ message: "Account id are required!" });

    const missingFields = [
      !name && "Name",
      !phoneNum && "Phone Number",
      !locations && "Locations",
      !saveAs && "SaveAs",
      !address && "Address",
    ]
      .filter(Boolean)
      .sort()
      .join(", ");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `${missingFields} are required!`,
      });
    }

    const findAddress = await addressModel.find({ accID: accID });

    if (findAddress.length >= 3) {
      return res.status(400).json({
        message: "You can't create more than 3 addresses.",
      });
    }

    let isDefault = setAsDefault;

    if (findAddress.length === 0) {
      isDefault = true;
    } else if (setAsDefault === true) {
      await addressModel.updateMany({ accID: accID }, { setAsDefault: false });
    }

    const createAddress = new addressModel({
      accID,
      name,
      phoneNum,
      address,
      saveAs,
      locations,
      company: company || null,
      mail: mail || null,
      taxID: taxID || null,
      setAsDefault: isDefault,
    });

    await createAddress.save();

    res.status(200).json({
      message: "Address created successfully",
      address: createAddress,
    });
  } catch (error) {
    console.log(error);
  }
};

const get = async (req, res) => {
  try {
    const address = await addressModel.findById(req.params.id);
    if (!address)
      return res.status(400).json({ message: "Address not found!" });

    res.status(200).json({ message: "Get address successfuly", address });
  } catch (error) {
    console.log(error);
  }
};

const getDefaultAddress = async (req, res) => {
  try {
    const accID = req.params.accID;
    if (!accID)
      return res.status(400).json({ message: "Account id not found!" });
    const address = await addressModel.findOne({ accID, setAsDefault: true });
    if (!address)
      return res.status(400).json({ message: "Address not found!" });
    res.status(200).json({ address });
  } catch (error) {
    console.log(error);
  }
};

const getAll = async (req, res) => {
  try {
    const accID = req.params.accID;
    if (!accID)
      return res.status(400).json({ message: "Account id are required!" });
    const addresses = await addressModel
      .find({ accID: accID })
      .sort({ createdAt: -1 })
      .limit(3);

    res.json({ message: "Get addess successfuly", addresses });
  } catch (error) {
    console.log(error);
  }
};

const remove = async (req, res) => {
  try {
    const { id, accID } = req.params;

    if (!id)
      return res.status(400).json({ message: "Address ID is required!" });
    if (!accID)
      return res.status(400).json({ message: "Account ID is required!" });

    const address = await addressModel.findById(id);

    if (!address) {
      return res.status(404).json({ message: "Address not found!" });
    }

    if (address.setAsDefault) {
      const otherAddress = await addressModel.findOne({
        accID,
        _id: { $ne: id },
      });

      if (otherAddress) {
        await addressModel.findByIdAndUpdate(otherAddress._id, {
          setAsDefault: true,
        });
      }
    }

    await addressModel.findByIdAndDelete(id);

    res.status(200).json({ message: "Address deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

const update = async (req, res) => {
  try {
    const { id, accID } = req.params;
    const {
      name,
      phoneNum,
      address,
      saveAs,
      locations,
      company,
      mail,
      taxID,
      setAsDefault,
    } = req.body;

    if (!id)
      return res.status(400).json({ message: "Address ID is required!" });
    if (!accID)
      return res.status(400).json({ message: "Account ID is required!" });

    const existingAddress = await addressModel.findById(id);
    if (!existingAddress)
      return res.status(404).json({ message: "Address not found!" });

    // If updating setAsDefault to true, reset all other addresses to false
    if (setAsDefault === true) {
      await addressModel.updateMany({ accID: accID }, { setAsDefault: false });
    }

    const updatedAddress = await addressModel.findByIdAndUpdate(
      id,
      {
        name,
        phoneNum,
        address,
        saveAs,
        locations,
        company: company || null,
        mail: mail || null,
        taxID: taxID || null,
        setAsDefault: setAsDefault || existingAddress.setAsDefault,
      },
      { new: true }
    );

    res.status(200).json({
      message: "Address updated successfully",
      address: updatedAddress,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { remove, get, getAll, create, update, getDefaultAddress };
