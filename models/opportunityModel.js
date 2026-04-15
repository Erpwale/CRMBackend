// models/Deal.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  name: String,
  description: String,
  qty: Number,
  rate: Number,
  totalValue: Number,
  terms: {
    type: [String],
    default: [],
  },
});

const OpportunitySchema = new mongoose.Schema(
  {
    date: String,

    companyName: String,
    address1: String,
    state: String,
    district: String,
    city: String,
    pincode: String,

    contactName: String,
    businessLine: String,

    products: [productSchema],

    subtotal: Number,
    gstTotal: Number,
    total: Number,
    net: Number,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Opportunity", OpportunitySchema);