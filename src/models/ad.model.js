const mongoose = require("mongoose");

const AdSchema = new mongoose.Schema(
  {
    image: { type: String, required: true }, // Cloudinary URL
    cloudinary_id: { type: String, required: true }, // Store Cloudinary public_id
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ad", AdSchema);
