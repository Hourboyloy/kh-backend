const mongoose = require("mongoose");

const bilingualStringSchema = new mongoose.Schema(
  {
    en: { type: String, required: true },
    kh: { type: String, required: true },
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    province: { type: bilingualStringSchema, required: true },
    district: { type: bilingualStringSchema, required: true },
    commune: { type: bilingualStringSchema, required: true },
  },
  { _id: false }
);

// Define the product schema
const productSchema = new mongoose.Schema(
  {
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "expired", "khqr"],
      default: "pending",
    },
    promotionActivatedAt: { type: Date, default: null },
    promotionExpiresAt: { type: Date, default: null },
    accID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "accounts",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    photos: {
      type: [String],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phoneNum: {
      type: [String],
      // match: /^[0-9]{9,10}$/,
      required: true,
    },
    mail: {
      type: String,
    },
    mainCategory: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
    },
    keySearchmainCategory: {
      type: String,
      required: true,
    },
    keySearchsubCategory: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    locations: { type: locationSchema, required: true },
    descriptions: {
      type: String,
      default: "",
    },
    views: { type: Number, default: 0 },
    reNewProductAtTime: {
      type: String,
      match: /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/,
      default: null,
    },

    // Dynamic fields
    dynamicFields: {
      type: Map,
      of: mongoose.Schema.Types.Mixed, // Supports any key-value pairs
      default: {},
    },

    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active",
    },

    boostStatus: {
      type: String,
      enum: ["", "rejected", "accepted", "pending"],
      default: "",
    },

    likes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "accounts" }], // Array of user IDs
      default: [],
    },

    saves: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "accounts" }], // Array of user IDs
      default: [],
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

const products = mongoose.model("products", productSchema);

module.exports = products;
