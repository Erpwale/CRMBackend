// models/BusinessLine.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
   description: {   // ✅ ADD THIS
    type: String,
    default: ""
  },

  rate: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
    RatechangeAllowed: { type: Boolean, default: false },
  discountAllowed: { type: Boolean, default: false },
  net: { type: Number, default: 0 }, // ✅ ADD

    termsAndConditions: {
      type: String,
      default: ""
    }
});

const PriceLevelSchema = new mongoose.Schema({
  levelName: { type: String, required: true }, // EU, MOP, CA 80%
  products: [ProductSchema]
});

const BusinessLineSchema = new mongoose.Schema(
  {
    businessLine: { type: String, required: true },
    priceLevels: [PriceLevelSchema] ,// ✅ NEW
    status: {
  type: String,
  enum: ["active", "inactive"],
  default: "active"
}
  },
  { timestamps: true }
);


module.exports = mongoose.model("BusinessLine", BusinessLineSchema);