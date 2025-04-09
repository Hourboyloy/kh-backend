const profiles = require("../models/profiles.model");
const productsModel = require("../models/products.model");

const searchSuggestions = async (req, res) => {
  try {
    let { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ message: "Keyword is required" });
    }

    keyword = keyword.trim().replace(/\+/g, " ");

    const escapedKeyword = keyword.replace(/[.*+?^=!:${}()|\[\]\/\\]/g, "\\$&");

    const regex = new RegExp(`^${escapedKeyword}`, "i");

    const suggestions = await productsModel
      .find({ title: { $regex: regex } })
      .limit(10)
      .select({ title: 1, _id: 0 })
      .lean();
    const formattedSuggestions = suggestions.map((item) => {
      const firstWord = item.title
        .split(" ")[0]
        .replace(/[^\p{L}\p{N}]+/gu, "");
      return { title: firstWord };
    });

    res.json({ suggestions: formattedSuggestions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const searchUserAndProduct = async (req, res) => {
  try {
    const keyword = req.query.keyword?.trim();
    if (!keyword) {
      return res.status(400).json({ message: "Keyword is required" });
    }

    let userQuery = {};
    let productQuery = {};

    if (keyword) {
      userQuery = {
        $or: [
          { username: { $regex: keyword, $options: "i" } },
          { firstName: { $regex: keyword, $options: "i" } },
          { lastName: { $regex: keyword, $options: "i" } },
        ],
      };

      productQuery = { title: { $regex: keyword, $options: "i" } };
    }

    const [users, products] = await Promise.all([
      profiles
        .find(userQuery)
        .select("username firstName lastName photoProfile")
        .limit(5)
        .lean(),
      productsModel
        .find(productQuery)
        .select("title photos locations dynamicFields updatedAt")
        .limit(10)
        .lean(),
    ]);

    res.json({ users, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const userGetByLimit = async (req, res) => {
  try {
    const keyword = req.query.keyword?.trim() || "";
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    let query = {};
    if (keyword) {
      query = {
        $or: [
          { username: { $regex: keyword, $options: "i" } },
          { firstName: { $regex: keyword, $options: "i" } },
          { lastName: { $regex: keyword, $options: "i" } },
        ],
      };
    }

    const users = await profiles
      .find(query)
      .select("username firstName lastName photoProfile")
      .skip(skip)
      .limit(limit)
      .lean();

    if (users.length === 0) {
      return res.json({ message: "No users found", users: [] });
    }

    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching users",
      error,
    });
  }
};

const queryProducts = async (req, res) => {
  try {
    const {
      mainCategory,
      subCategory,
      keyword,
      province,
      district,
      commune,
      discount,
      freeDelivery,
      minPrice,
      maxPrice,
      minSalary,
      maxSalary,
      minSalePrice,
      maxSalePrice,
      condition,
      brand,
      model,
      vehicleType,
      network,
      type,
      bodyType,
      accessory,
      sort,
      date,
      top,
      page = 1,
      limit = 35, // Added a limit, default 28 for simple products
    } = req.query;

    let query = {};

    // 🔍 Case-insensitive Search by keyword in title
    if (keyword) {
      query.title = {
        $regex: keyword.replace(/[+]/g, " ").trim().toLowerCase(),
        $options: "i",
      };
    }

    if (mainCategory)
      query["keySearchmainCategory"] = {
        $regex: mainCategory.trim(),
        $options: "i",
      };

    if (subCategory)
      query["keySearchsubCategory"] = {
        $regex: subCategory.trim(),
        $options: "i",
      };

    // 🌍 Location-based filtering (Case-insensitive)
    if (province)
      query["locations.province.en"] = {
        $regex: province.replace(/[-]/g, " ").trim().toLowerCase(),
        $options: "i",
      };

    if (district)
      query["locations.district.en"] = {
        $regex: district.replace(/[-]/g, " ").trim().toLowerCase(),
        $options: "i",
      };
    if (commune)
      query["locations.commune.en"] = {
        $regex: commune.replace(/[-]/g, " ").trim().toLowerCase(),
        $options: "i",
      };

    // 🎯 Dynamic fields filtering (Optional fields) with case-insensitive search
    if (discount === "true") {
      query["dynamicFields.discount"] = { $exists: true, $ne: 0 };
    }

    if (freeDelivery === "true") query["dynamicFields.freeDelivery"] = "true";

    if (condition)
      query["dynamicFields.condition"] = {
        $regex: condition.trim().toLowerCase(),
        $options: "i",
      };

    if (brand)
      query["dynamicFields.brand"] = {
        $regex: brand.replace(/[-]/g, " ").trim().toLowerCase(),
        $options: "i",
      };
    if (model)
      query["dynamicFields.model"] = {
        $regex: model.replace(/[-]/g, " ").trim().toLowerCase(),
        $options: "i",
      };
    if (vehicleType)
      query["dynamicFields.vehicleType"] = {
        $regex: vehicleType.replace(/[-]/g, " ").trim().toLowerCase(),
        $options: "i",
      };
    if (network)
      query["dynamicFields.network"] = {
        $regex: network.replace(/[-]/g, " ").trim().toLowerCase(),
        $options: "i",
      };
    if (type)
      query["dynamicFields.type"] = {
        $regex: type.replace(/[-]/g, " ").trim().toLowerCase(),
        $options: "i",
      };
    if (bodyType)
      query["dynamicFields.bodyType"] = {
        $regex: bodyType.replace(/[-]/g, " ").trim().toLowerCase(),
        $options: "i",
      };
    if (accessory)
      query["dynamicFields.accessory"] = {
        $regex: accessory.replace(/[-]/g, " ").trim().toLowerCase(),
        $options: "i",
      };

    // 💰 Price Range Filtering
    if (minPrice || maxPrice) {
      query["dynamicFields.price"] = {};
      if (minPrice) query["dynamicFields.price"].$gte = parseFloat(minPrice);
      if (maxPrice) query["dynamicFields.price"].$lte = parseFloat(maxPrice);
    }

    // 💵 Sale Price Range Filtering
    if (minSalePrice || maxSalePrice) {
      query["dynamicFields.salePrice"] = {};
      if (minSalePrice)
        query["dynamicFields.salePrice"].$gte = parseFloat(minSalePrice);
      if (maxSalePrice)
        query["dynamicFields.salePrice"].$lte = parseFloat(maxSalePrice);
    }

    // 💼 Salary Range Filtering
    if (minSalary || maxSalary) {
      query["dynamicFields.salary"] = {};
      if (minSalary) query["dynamicFields.salary"].$gte = parseFloat(minSalary);
      if (maxSalary) query["dynamicFields.salary"].$lte = parseFloat(maxSalary);
    }

    // ✨ Sorting (default: newest first)
    let sortOption = { updatedAt: -1 };
    if (sort === "priceasc")
      sortOption = {
        "dynamicFields.price": 1,
        "dynamicFields.salePrice": 1,
        "dynamicFields.salary": 1,
      };
    if (sort === "pricedesc")
      sortOption = {
        "dynamicFields.price": -1,
        "dynamicFields.salePrice": -1,
        "dynamicFields.salary": -1,
      };
    if (sort === "new") sortOption = { updatedAt: -1 };
    if (sort === "latest") sortOption = { createdAt: -1 };
    if (sort === "mosthit") sortOption = { views: -1 };

    // filter by date
    if (date) {
      const now = new Date();
      let startDate;

      if (date === "today") {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
      } else if (date === "last-7-days") {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
      } else if (date === "last-14-days") {
        startDate = new Date();
        startDate.setDate(now.getDate() - 14);
        startDate.setHours(0, 0, 0, 0);
      } else if (date === "last-30-days") {
        startDate = new Date();
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
      }

      if (startDate) {
        query.updatedAt = { $gte: startDate };
      }
    }

    // Query for top products with promotions
    let topProducts = [];
    if (top) {
      topProducts = await productsModel
        .find({
          ...query,
          promotionActivatedAt: { $exists: true },
          promotionExpiresAt: { $exists: true },
          promotionActivatedAt: { $lte: new Date() },
          promotionExpiresAt: { $gte: new Date() },
        })
        .sort(sortOption)
        .skip((page - 1) * limit) // Pagination for topProducts
        .limit(10) // Limit to 10 items for topProducts
        .lean();
    }

    // Query for simple products
    const simpleProducts = await productsModel
      .find(query)
      .sort(sortOption)
      .skip((page - 1) * limit) // Pagination for simpleProducts
      .limit(limit) // Limit for simpleProducts
      .lean();

    const firstProducts = simpleProducts.slice(0, 15);
    const secondProducts = simpleProducts.slice(15, 35);

    const finalProduct = [
      {
        topProducts,
        firstProducts,
        secondProducts,
      },
    ];
    res.json({ products: finalProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const handleUpdatePromotion = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30); // 30 days from now

    // Find 10 products that need to be updated (no filtering, just get the first 10)
    const productsToUpdate = await productsModel.find({}).limit(10); // Get first 10 products

    // Check if there are products to update
    if (productsToUpdate.length === 0) {
      return res.status(404).json({ message: "No products found to update" });
    }

    // Update the promotionActivatedAt and promotionExpiresAt fields for each product
    const updatePromises = productsToUpdate.map((product) => {
      return productsModel.updateOne(
        { _id: product._id }, // Match by the product's _id
        {
          $set: {
            promotionActivatedAt: now, // Set current date
            promotionExpiresAt: thirtyDaysLater, // Set 30 days from now
          },
        }
      );
    });

    // Wait for all update operations to complete
    const updateResults = await Promise.all(updatePromises);

    // Count how many products were updated
    const updatedCount = updateResults.filter(
      (result) => result.modifiedCount > 0
    ).length;

    console.log("Update Results:", updateResults);

    if (updatedCount > 0) {
      res.json({
        message: "Promotion dates updated successfully",
        updatedCount,
      });
    } else {
      res.status(404).json({ message: "No products were updated" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  handleUpdatePromotion,
  searchUserAndProduct,
  userGetByLimit,
  searchSuggestions,
  queryProducts,
};
