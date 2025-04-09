const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    khName: { type: String, trim: true },
    photo: { type: String },
    fields: { type: [String], default: [] }, // Dynamic fields for product attributes (key-value pairs)
  },
  { timestamps: true }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    khName: { type: String, required: true, trim: true },
    photo: { type: String },
    subcategories: {
      type: [subcategorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

const categories = mongoose.model("categories", categorySchema);

module.exports = categories;
