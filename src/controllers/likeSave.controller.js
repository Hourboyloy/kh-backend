const productsModel = require("../models/products.model");
const { likes, saves } = require("../models/likeAndSave.model");

const like = async (req, res) => {
  try {
    const { title, photoUrl, province, price } = req.body;
    const { accID, id } = req.params;

    if (!accID)
      return res.status(400).json({ message: "Account ID not found!" });
    if (!id) return res.status(400).json({ message: "Product ID not found!" });

    const product = await productsModel.findById(id);
    if (!product)
      return res.status(400).json({ message: "Product not found!" });

    if (product.accID.toString() === accID)
      return res.status(400).json({ message: "Can't like your own product" });

    // Add accID to likes array (prevent duplicate)
    await productsModel.findByIdAndUpdate(
      id,
      { $addToSet: { likes: accID } },
      { timestamps: false }
    );

    // Save like in `likes` model
    const likeData = new likes({
      productID: id,
      accID,
      title,
      price,
      photoUrl: photoUrl || null,
      province,
    });

    const savedLike = await likeData.save();

    // Fetch the updated product with the likes array
    const updatedProduct = await productsModel.findById(id);

    res.json({
      message: "Liked successfully",
      like: savedLike,
      likes: updatedProduct.likes, // Return the updated likes array
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

const unLike = async (req, res) => {
  try {
    const { accID, id } = req.params;

    if (!accID)
      return res.status(400).json({ message: "Account ID not found!" });
    if (!id) return res.status(400).json({ message: "Product ID not found!" });

    // Execute both queries at the same time
    await Promise.all([
      productsModel.findByIdAndUpdate(
        id,
        { $pull: { likes: accID } },
        { timestamps: false }
      ),
      likes.findOneAndDelete({ productID: id, accID }),
    ]);

    // Fetch the updated product with `lean()` for better performance
    const updatedProduct = await productsModel.findById(id).lean();

    res.json({
      message: "Unliked successfully",
      likes: updatedProduct?.likes || [], // Avoid potential errors
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

const save = async (req, res) => {
  try {
    const { title, photoUrl, province, price } = req.body;
    const { accID, id } = req.params;

    if (!accID)
      return res.status(400).json({ message: "Account ID not found!" });
    if (!id) return res.status(400).json({ message: "Product ID not found!" });

    const product = await productsModel.findById(id);
    if (!product)
      return res.status(400).json({ message: "Product not found!" });

    if (product.accID.toString() === accID)
      return res.status(400).json({ message: "Can't save your own product" });

    // Add accID to saves array (prevent duplicate)
    await productsModel.findByIdAndUpdate(
      id,
      { $addToSet: { saves: accID } },
      { timestamps: false }
    );

    // Save save in `saves` model
    const saveData = new saves({
      productID: id,
      accID,
      title,
      photoUrl: photoUrl || null,
      province,
      price,
    });

    const savedProduct = await saveData.save();

    // Fetch the updated product with the saves array
    const updatedProduct = await productsModel.findById(id);

    res.json({
      message: "Saved successfully",
      savedProduct,
      saves: updatedProduct.saves, // Return the updated saves array
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

const removeSave = async (req, res) => {
  try {
    const { accID, id } = req.params;

    if (!accID)
      return res.status(400).json({ message: "Account ID not found!" });
    if (!id) return res.status(400).json({ message: "Product ID not found!" });

    // Execute both operations simultaneously
    await Promise.all([
      productsModel.findByIdAndUpdate(
        id,
        { $pull: { saves: accID } },
        { timestamps: false }
      ),
      saves.findOneAndDelete({ productID: id, accID }),
    ]);

    // Get updated product
    const updatedProduct = await productsModel.findById(id).lean();

    res.json({
      message: "Unsaved successfully",
      saves: updatedProduct?.saves || [], // return empty array if no saves
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

const getLikedByLimit = async (req, res) => {
  try {
    const { accID } = req.params;
    const { page = 1 } = req.query;
    const limit = 20;
    const skip = (page - 1) * limit;

    if (!accID)
      return res.status(400).json({ message: "Account ID not found!" });
    const likedProducts = await likes
      .find({ accID })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      message: "Likes fetched successfully",
      products: likedProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

const getSavedByLimit = async (req, res) => {
  try {
    const { accID } = req.params;
    const { page = 1 } = req.query;
    const limit = 20;
    const skip = (page - 1) * limit;

    if (!accID)
      return res.status(400).json({ message: "Account ID not found!" });

    const savedProducts = await saves
      .find({ accID })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      message: "Saves fetched successfully",
      products: savedProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  like,
  unLike,
  getLikedByLimit,
  save,
  removeSave,
  getSavedByLimit,
};
