// models/BusinessLine.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rate: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },

  // ✅ move here
  discountAllowed: { type: Boolean, default: false },
});

const BusinessLineSchema = new mongoose.Schema(
  {
    businessLine: { type: String, required: true },

    // ❌ remove from here
    // discountAllowed: { type: Boolean },

    products: [ProductSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("BusinessLine", BusinessLineSchema);