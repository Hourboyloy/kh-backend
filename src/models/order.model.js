const mongoose = require("mongoose");

const orderModel = new mongoose.Schema({
  accID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "accounts",
    required: true,
  },
  proID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "products",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  photoURLs: {
    type: [String],
    default: [],
  },
  username: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },

  status: {
    type: String,
    enum: ["reject", "accept", "pending"],
    default: "pending",
  },

  orderAt: { type: Date, default: Date.now },
  statusUpdatedAt: { type: Date },
});

const orders = mongoose.model("orders", orderModel);

module.exports = orders;
