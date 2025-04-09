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

const addressSchema = new mongoose.Schema(
  {
    accID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "accounts",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    phoneNum: { type: [String], required: true },
    address: { type: String, required: true },
    saveAs: { type: String, required: true },
    locations: { type: locationSchema, required: true },
    company: { type: String },
    mail: { type: String },
    taxID: { type: String },
    setAsDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const address = mongoose.model("addresses", addressSchema);
module.exports = address;
