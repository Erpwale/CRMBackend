// models/BusinessLine.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rate: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
});

const BusinessLineSchema = new mongoose.Schema(
  {
    businessLine: { type: String, required: true },
    discountAllowed: { type: Boolean, default: false },

    products: [ProductSchema],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BusinessLine", BusinessLineSchema);