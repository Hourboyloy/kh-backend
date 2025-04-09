const categoryModel = require("../models/categories.model");
const cloudinary = require("../cloud/connectionCloadinary");

const getAll = async (req, res) => {
  try {
    const categories = await categoryModel.find().limit(12).lean();
    res.json({ categories });
  } catch (error) {}
};

const createMainCategory = async (req, res) => {
  try {
    if (!req.file || !req.body.name || !req.body.khName) {
      return res.json({ message: "File ,name and khName are required!" });
    }
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.json({
        message: "Invalid file type. Only images are allowed.",
      });
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "kh24/photos",
    });

    const newCategory = new categoryModel({
      name: req.body.name,
      khName: req.body.khName,
      photo: result.secure_url,
      subcategories: [],
    });

    const savedCategory = await newCategory.save();
    res.json({
      message: "Category created successfully",
      category: savedCategory,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating category", error });
  }
};

const removeMainCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await categoryModel.findById(categoryId);
    if (!category) return res.json({ message: "Category not found" });
    const publicId = category.photo
      .split("/")
      .slice(-3)
      .join("/")
      .split(".")[0];
    await cloudinary.uploader.destroy(publicId);
    await categoryModel.findByIdAndDelete(categoryId);
    res.json({ message: "Category and photo deleted successfully" });
  } catch (error) {}
};

const editMainCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.json({ message: "Category not found" });
    }
    const updatedData = {};
    if (req.body.name) {
      updatedData.name = req.body.name;
    }

    if (req.body.khName) {
      updatedData.khName = req.body.khName;
    }

    if (req.file) {
      if (category.photo) {
        const publicId = category.photo
          .split("/")
          .slice(-3)
          .join("/")
          .split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "kh24/photos",
      });
      updatedData.photo = result.secure_url;
    }
    const updatedCategory = await categoryModel.findByIdAndUpdate(
      categoryId,
      updatedData,
      { new: true }
    );

    res.json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    res.json({ message: "Error editing category", error });
  }
};

const addSubCategory = async (req, res) => {
  try {
    const { name, khName } = req.body;
    const categoryId = req.params.id;
    if (!req.file || !name || !khName)
      return res.json({ message: "Photo, Name and khName are required!" });
    const categoryRes = await categoryModel.findById(categoryId);
    const photo = await cloudinary.uploader.upload(req.file.path, {
      folder: "kh24/photos",
    });

    categoryRes.subcategories.push({
      name,
      khName,
      photo: photo.secure_url,
      fields: [],
    });
    await categoryRes.save();

    res.json({
      message: "add sub category successfully",
      category: categoryRes,
    });
  } catch (error) {
    console.log(error);
  }
};

const removeSubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.body;
    const categoryId = req.params.id;
    const categoryRes = await categoryModel.findById(categoryId);
    const subCategory = categoryRes.subcategories.id(subCategoryId);
    if (!subCategory) {
      return res.json({ message: "Subcategory not found" });
    }
    if (subCategory.photo) {
      const publicId = subCategory.photo
        .split("/")
        .slice(-3)
        .join("/")
        .split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }
    const updatedSubcategories = categoryRes.subcategories.filter(
      (sub) => sub._id.toString() !== subCategoryId
    );
    categoryRes.subcategories = updatedSubcategories;
    await categoryRes.save();

    res.json({
      message: "Subcategory removed successfully",
      category: categoryRes,
    });
  } catch (error) {
    console.error("Error removing subcategory:", error);
    res.status(500).json({ message: "Error removing subcategory", error });
  }
};

const editSubCategory = async (req, res) => {
  try {
    const { subCategoryId, name, khName } = req.body;
    const categoryId = req.params.id;

    const categoryRes = await categoryModel.findById(categoryId);
    if (!categoryRes) {
      return res.json({ message: "Category not found" });
    }
    const subCategory = categoryRes.subcategories.id(subCategoryId);
    if (!subCategory) {
      return res.json({ message: "Subcategory not found" });
    }

    subCategory.name = name || subCategory.name;
    subCategory.khName = khName || subCategory.khName;
    subCategory.fields = subCategory.fields;

    if (req.file) {
      if (subCategory.photo) {
        const publicId = subCategory.photo
          .split("/")
          .slice(-3)
          .join("/")
          .split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }
      const photo = await cloudinary.uploader.upload(req.file.path, {
        folder: "kh24/photos",
      });
      subCategory.photo = photo.secure_url;
    }
    await categoryRes.save();
    res.json({
      message: "Subcategory updated successfully",
      category: categoryRes,
    });
  } catch (error) {
    res.json({ message: "Error editing subcategory", error });
  }
};

const editFieldsInSubCategory = async (req, res) => {
  try {
    const { subCategoryId, newFields } = req.body;
    const categoryId = req.params.id;

    if (!Array.isArray(newFields)) {
      return res.json({ message: "Fields must be an array of strings" });
    }

    const categoryRes = await categoryModel.findById(categoryId);
    if (!categoryRes) {
      return res.json({ message: "Category not found" });
    }

    const subCategory = categoryRes.subcategories.id(subCategoryId);
    if (!subCategory) {
      return res.json({ message: "Subcategory not found" });
    }

    // Replace the fields array with the new array
    subCategory.fields = newFields;

    // Save the updated category
    await categoryRes.save();

    res.json({
      message: "Fields updated successfully",
      category: categoryRes,
    });
  } catch (error) {
    console.error("Error editing fields in subcategory:", error);
    res
      .status(500)
      .json({ message: "Error editing fields in subcategory", error });
  }
};

module.exports = {
  getAll,
  createMainCategory,
  removeMainCategory,
  editMainCategory,
  addSubCategory,
  removeSubCategory,
  editSubCategory,
  editFieldsInSubCategory,
};
