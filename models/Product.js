// models/Product.js

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    required: true,
  },

  features: {
    topFeatures: {
      type: [String],
      default: [],
    },
    includedFeatures: {
      type: [String],
      default: [],
    },
  },

  category: {
    type: String,
    required: true,
  },

  pricingType: {
    type: String,
    enum: ["Yearly", "one-time"],
    default: "Yearly",
  },

  price: {
    type: Number,
    default: 0,
  },

  image: {
    type: String,
    default: "",
  },

  isDeleted: {
    type: Boolean,
    default: false,
  },

  deletedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Product", productSchema);