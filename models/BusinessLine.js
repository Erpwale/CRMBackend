// models/BusinessLine.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rate: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  discountAllowed: { type: Boolean, default: false }
});

const PriceLevelSchema = new mongoose.Schema({
  levelName: { type: String, required: true }, // EU, MOP, CA 80%
  products: [ProductSchema]
});

const BusinessLineSchema = new mongoose.Schema(
  {
    businessLine: { type: String, required: true, unique: true },
    priceLevels: [PriceLevelSchema] // ✅ NEW
  },
  { timestamps: true }
);


module.exports = mongoose.model("BusinessLine", BusinessLineSchema);