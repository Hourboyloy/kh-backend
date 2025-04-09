const mongoose = require("mongoose");

// Save Schema
const saveSchema = new mongoose.Schema(
  {
    accID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "accounts",
      required: true,
    },
    productID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "accounts",
      required: true,
    },
    title: { type: String, required: true },
    photoUrl: { type: String },
    province: { type: String, required: true },
    price: { type: String, required: true },
  },
  { timestamps: true }
);

const saves = mongoose.model("saves", saveSchema);

// Like Schema
const likeSchema = new mongoose.Schema(
  {
    accID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "accounts",
      required: true,
    },
    productID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "accounts",
      required: true,
    },
    title: { type: String, required: true },
    photoUrl: { type: String },
    province: { type: String, required: true },
    price: { type: String, required: true },
  },
  { timestamps: true }
);

const likes = mongoose.model("likes", likeSchema);

// Export both models
module.exports = { saves, likes };
