const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    phoneNum: {
      type: Number,
      required: true,
    },
    password: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      default: null,
    },
    posts: { type: Number, default: 0 },
    isVerify: {
      type: Boolean,
      default: false,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    language: {
      type: String,
      default: "english",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("accounts", accountSchema);
