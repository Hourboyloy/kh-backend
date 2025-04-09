const fs = require("fs");
const cloudinary = require("../cloud/connectionCloadinary");
const productsModel = require("../models/products.model");
const profiles = require("../models/profiles.model");
const processCategory = require("../helper/processCategory");
const BATCH_SIZE = 500;

const getProductsWhenLoadHomePage = async (req, res) => {
  try {
    const currentDate = new Date();
    const [topProducts, latestAds] = await Promise.all([
      productsModel
        .find({
          promotionActivatedAt: { $ne: null },
          promotionExpiresAt: { $gte: currentDate },
        })
        .sort({ promotionActivatedAt: -1 })
        .limit(10),
      productsModel.find().sort({ updatedAt: -1 }).limit(34).lean(),
    ]);

    res.json({
      topProducts,
      latestAds,
    });
  } catch (error) {
    res.json({
      message: "កំហុសក្នុងប្រព័ន្ធ",
      error,
    });
  }
};

const getNewProductsByLimit = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const products = await productsModel
      .find()
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    res.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDetails = async (req, res) => {
  try {
    const productResponse = await productsModel.findById(req.params.id);
    if (!productResponse)
      return res.status(400).json({ message: "Product not found" });

    await productsModel.updateOne(
      { _id: productResponse._id },
      { $inc: { views: 1 } },
      { timestamps: false }
    );

    // Fetch profile details
    const profileResponse = await profiles.findOne({
      accID: productResponse.accID,
    });

    // Get related posts from the same seller (excluding the current product)
    const relatedPosts = await productsModel
      .find({
        accID: productResponse.accID,
        _id: { $ne: productResponse._id }, // Exclude the current product
      })
      .sort({ updatedAt: -1 })
      .limit(28);

    res.json({
      message: "Get product successfully",
      product: productResponse,
      profile: profileResponse,
      relatedPosts: relatedPosts || [],
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Error", error });
  }
};

const getProduct = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Id not found!" });

    const product = await productsModel
      .findById(id)
      .select("title photos accID promotionActivatedAt promotionExpiresAt")
      .lean();
    res.status(200).json({ product });
  } catch (error) {
    console.log(error);
  }
};

const getForUpdate = async (req, res) => {
  try {
    const productResponse = await productsModel.findById(req.params.id);
    if (!productResponse)
      return res.status(400).json({ message: "Product not found" });

    res.json({
      message: "Get product successfully",
      product: productResponse,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Error", error });
  }
};

const getProductsLimit = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const responce = await productsModel.find().skip(skip).limit(limit).lean();
    if (!responce || responce.length === 0) {
      return res.json({ message: "No products found", products: [] });
    }
    const totalCount = await productsModel.estimatedDocumentCount();
    res.json({
      products: responce,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      message: "Error fetching products",
      error,
    });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.query;

    console.log("Delete Reason:", reason);

    const product = await productsModel.findById(id);
    if (!product) {
      return res.json({ message: "Product not found" });
    }

    for (const photoUrl of product.photos) {
      const publicId = photoUrl.split("/").slice(-3).join("/").split(".")[0];
      await cloudinary.uploader.destroy(`kh24/photos/${publicId}`);
    }

    const resSpon = await productsModel.findByIdAndDelete(id);
    if (!resSpon) {
      return res.status(400).json({
        message: "Product and associated photos can't be deleted",
      });
    }

    return res.json({
      message: "Product and associated photos deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ message: "Error deleting product", error });
  }
};

const create = async (req, res) => {
  try {
    const {
      title,
      name,
      phoneNum,
      mail,
      mainCategory,
      subCategory,
      keySearchsubCategory,
      keySearchmainCategory,
      address,
      locations,
      descriptions,
      dynamicFields,
      username,
    } = req.body;

    const accID = req.params.accID;
    const photos = req.files;
    let parsedDynamicFields = null;

    if (!accID) return res.json({ message: "Account id are required!" });

    const missingFields = [
      !title && "Title",
      !name && "Name",
      !phoneNum && "Phone Number",
      !address && "Address",
      !locations && "Locations",
      !descriptions && "Description",
      !username && "Username",
    ]
      .filter(Boolean)
      .sort()
      .join(", ");

    if (missingFields.length > 0) {
      return res.json({
        message: `${missingFields} are required!`,
      });
    }

    const photoUrls = await Promise.all(
      photos.map(async (file) => {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "kh24/photos",
          });
          fs.unlinkSync(file.path);
          return result.secure_url;
        } catch (uploadError) {
          console.error("Error uploading file to Cloudinary:", uploadError);
        }
      })
    );

    // locations
    const parsedLocations =
      typeof locations === "string" ? JSON.parse(locations) : locations;

    if (dynamicFields) {
      parsedDynamicFields = JSON.parse(JSON.stringify(dynamicFields));

      // Check and convert price, salePrice, salary to numbers if they exist
      const fieldsToConvert = ["price", "salePrice", "salary"];
      fieldsToConvert.forEach((field) => {
        if (parsedDynamicFields[field]) {
          parsedDynamicFields[field] = parseFloat(parsedDynamicFields[field]);
        }
      });
    }

    // Process the categories
    const keySearchmain = processCategory(keySearchmainCategory);
    const keySearchsub = processCategory(keySearchsubCategory);

    const newProduct = new productsModel({
      accID,
      title,
      name,
      phoneNum,
      mail: mail || "",
      mainCategory,
      subCategory,
      keySearchmainCategory: keySearchmain,
      keySearchsubCategory: keySearchsub,
      address,
      locations: parsedLocations,
      descriptions,
      username,
      dynamicFields: parsedDynamicFields || {},
      photos: photoUrls || [],
      boostStatus: "",
    });

    await newProduct.save();

    res.json({ message: "Product created successfully", product: newProduct });
  } catch (error) {
    res.json({ message: "Error creating product", error });
  }
};

const update = async (req, res) => {
  try {
    const {
      title,
      name,
      phoneNum,
      mail,
      mainCategory,
      subCategory,
      keySearchsubCategory,
      keySearchmainCategory,
      address,
      locations,
      descriptions,
      dynamicFields,
      photoUrls,
      username,
    } = req.body;

    const productID = req.params.id;
    const newPhotos = req.files || [];
    let uploadedPhotos = [];

    if (!productID) {
      return res.status(400).json({ message: "Product ID is required!" });
    }

    const product = await productsModel.findById(productID);
    if (!product) {
      return res.status(404).json({ message: "Product not found!" });
    }

    const keySearchmain = keySearchmainCategory
      ? processCategory(keySearchmainCategory)
      : product.keySearchmainCategory;
    const keySearchsub = keySearchsubCategory
      ? processCategory(keySearchsubCategory)
      : product.keySearchsubCategory;

    // Upload new images to Cloudinary
    if (newPhotos.length > 0) {
      uploadedPhotos = await Promise.all(
        newPhotos.map(async (file) => {
          try {
            const result = await cloudinary.uploader.upload(file.path, {
              folder: "kh24/photos",
            });
            fs.unlinkSync(file.path); // Remove local file after upload
            return result.secure_url;
          } catch (uploadError) {
            console.error("Error uploading file to Cloudinary:", uploadError);
            return null;
          }
        })
      ).then((results) => results.filter(Boolean)); // Remove null values
    }

    // Replace `null` in `photoUrls` with `uploadedPhotos`
    let newPhotoArray;
    if (typeof photoUrls === "string") {
      try {
        newPhotoArray = JSON.parse(photoUrls);
        if (!Array.isArray(newPhotoArray)) {
          newPhotoArray = [newPhotoArray]; // Convert single URL to array
        }
      } catch {
        newPhotoArray = [photoUrls]; // Assume it's a single URL and wrap it in an array
      }
    } else {
      newPhotoArray = Array.isArray(photoUrls) ? photoUrls : [];
    }

    let uploadIndex = 0;

    if (uploadedPhotos.length > 0) {
      newPhotoArray = newPhotoArray.map((photo) =>
        (photo === null || photo === "null") &&
        uploadIndex < uploadedPhotos.length
          ? uploadedPhotos[uploadIndex++]
          : photo
      );
    }

    // Remove old photos from Cloudinary if they are no longer in `photoUrls`
    const oldPhotos = Array.isArray(product.photos) ? product.photos : [];
    const removedPhotos = oldPhotos.filter(
      (url) => !newPhotoArray.includes(url)
    );

    await Promise.all(
      removedPhotos.map(async (url) => {
        try {
          const publicId = url.match(/\/kh24\/photos\/(.+?)\./)?.[1];
          if (publicId) {
            await cloudinary.uploader.destroy(`kh24/photos/${publicId}`);
          }
        } catch (err) {
          console.error("Error deleting Cloudinary image:", err);
        }
      })
    );

    if (dynamicFields) {
      const parsedDynamicFields = JSON.parse(JSON.stringify(dynamicFields));

      const fieldsToConvert = ["price", "salePrice", "salary"];
      fieldsToConvert.forEach((field) => {
        if (parsedDynamicFields[field]) {
          parsedDynamicFields[field] = parseFloat(parsedDynamicFields[field]);
        }
      });

      product.dynamicFields = parsedDynamicFields;
    }

    // ✅ 4️⃣ Update product data
    product.title = title || product.title;
    product.name = name || product.name;
    product.phoneNum = phoneNum || product.phoneNum;
    product.mail = mail || product.mail;
    product.mainCategory = mainCategory || product.mainCategory;
    product.subCategory = subCategory || product.subCategory;
    product.keySearchmainCategory = keySearchmain;
    product.keySearchsubCategory = keySearchsub;
    product.address = address || product.address;
    product.username = username || product.username;
    product.locations =
      typeof locations === "string" ? JSON.parse(locations) : locations;
    product.descriptions = descriptions || product.descriptions;
    product.photos = newPhotoArray;

    await product.save();

    res.json({ message: "Product updated successfully", product });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getProductsByStatus = async (req, res) => {
  try {
    const { accID, status } = req.params;
    if (accID === "undefined")
      return res.status(400).json({ message: "accID not found!" });

    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const query = { accID: accID };
    if (status) query.status = status;
    const productsResponce = await productsModel
      .find(query)
      .skip(skip)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    res.json({ products: productsResponce });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const countStutus = async (req, res) => {
  try {
    const { accID } = req.params;

    // Count active items
    const activeCount = await productsModel.countDocuments({
      accID: accID,
      status: "active",
    });

    const expiredCount = await productsModel.countDocuments({
      accID: accID,
      status: "expired",
    });

    res.json({
      activeCount,
      expiredCount,
    });
  } catch (error) {
    console.log("Error counting active and expired items:", error);
    res
      .status(500)
      .json({ message: "Error counting active and expired items", error });
  }
};

const renew = async (req, res) => {
  try {
    const { proID } = req.params;
    const product = await productsModel.findById(proID);
    if (!product) res.status(400).json({ message: "Product not found!" });

    const hoursSinceUpdate = (Date.now() - new Date(product.updatedAt)) / 36e5;
    if (hoursSinceUpdate < 12) {
      return res.status(400).json({
        message:
          "Product can only be renewed after 12 hours since the last update.",
      });
    }
    product.updatedAt = Date.now();
    await product.save();
    res.status(200).json({ message: "Product renewed successfully.", product });
  } catch (error) {
    console.log(error);
  }
};

const setRenew = async (req, res) => {
  try {
    const { proID } = req.params;
    const timeRegex = /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/;
    const reNewProductAtTime = req.body.reNewProductAtTime;

    if (!timeRegex.test(reNewProductAtTime)) {
      return res
        .status(400)
        .json({ message: "Invalid time format. Use hh:mm AM/PM." });
    }

    const product = await productsModel.findById(proID);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    await productsModel.updateOne(
      { _id: proID },
      { $set: { reNewProductAtTime } },
      { timestamps: false } // ❌ Prevents automatic `updatedAt` change
    );

    res.status(200).json({ message: "Renew time set successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

const renewAll = async (req, res) => {
  try {
    const now = new Date();
    let skip = 0;
    let updatedCount = 0;

    while (true) {
      // Log the query
      console.log(
        `Querying products with skip ${skip} and limit ${BATCH_SIZE}`
      );

      const products = await productsModel
        .find({
          reNewProductAtTime: { $ne: null },
          updatedAt: { $lte: new Date(Date.now() - 12 * 60 * 60 * 1000) }, // 12 hours ago
        })
        .skip(skip)
        .limit(BATCH_SIZE);

      if (products.length === 0) {
        console.log("No products found matching the criteria.");
        break;
      }

      console.log(`Found ${products.length} products to process`);

      for (let product of products) {
        const reNewProductAtTime = product.reNewProductAtTime;

        if (
          !reNewProductAtTime ||
          !/^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(reNewProductAtTime)
        ) {
          console.error(
            "Invalid reNewProductAtTime format:",
            reNewProductAtTime
          );
          continue;
        }

        const [time, period] = reNewProductAtTime.split(" ");
        const [hour, minute] = time.split(":").map(Number);

        let reNewDate = new Date();
        reNewDate.setHours(
          period === "PM" && hour !== 12
            ? hour + 12
            : period === "AM" && hour === 12
            ? 0
            : hour
        );
        reNewDate.setMinutes(minute);
        reNewDate.setSeconds(0);
        reNewDate.setMilliseconds(0);

        const isSameTime =
          now.getHours() === reNewDate.getHours() &&
          now.getMinutes() === reNewDate.getMinutes();

        if (!isSameTime) continue;

        try {
          product.updatedAt = now;
          await product.save();
          updatedCount++;
        } catch (saveError) {
          console.error("Error saving product:", saveError);
        }
      }

      skip += BATCH_SIZE;
    }

    if (updatedCount === 0) {
      return res.status(400).json({
        message:
          updatedCount === 0
            ? "No products met the renewal criteria (either already updated or incorrect time format)."
            : "Some unknown error occurred.",
      });
    }

    res.status(200).json({
      message: `${updatedCount} products renewed successfully.`,
    });
  } catch (error) {
    console.error("Renew Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const productSearching = async (req, res) => {
  try {
    const { accID, keyword, status } = req.params;

    const product = await productsModel.findOne({
      accID: accID,
      status: status,
      title: { $regex: keyword, $options: "i" },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

module.exports = {
  getProductsWhenLoadHomePage,
  productSearching,
  create,
  remove,
  update,
  getForUpdate,
  getDetails,
  getProductsLimit,
  getProductsByStatus,
  countStutus,
  renew,
  renewAll,
  setRenew,
  getProduct,
  getNewProductsByLimit,
};
