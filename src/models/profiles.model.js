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

const profileSchema = new mongoose.Schema(
  {
    accID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "accounts",
      required: true,
    },
    username: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, default: null },
    dob: { type: String, default: null },
    company: { type: String, default: null },
    mail: { type: String, default: null },
    phoneNum: { type: [String], default: null },
    address: { type: String, default: null },
    location: { type: locationSchema },
    photoProfile: {
      type: String,
      default: null,
    },
    photoCover: {
      type: String,
      default: null,
    },
    coverCloudId: {
      type: String,
      default: null,
    },
    profileCloudId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Profiles = mongoose.model("profiles", profileSchema);

module.exports = Profiles;
