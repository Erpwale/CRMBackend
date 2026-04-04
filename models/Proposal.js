const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  qty: Number,
  rate: Number,
  totalValue: Number
});

const proposalSchema = new mongoose.Schema({
  companyName: String,
  address1: String,
  address2: String,
  state: String,
  city: String,
  pincode: String,
  date: String,
  contactName: String,
  businessLine: String,
  products: [productSchema],

  discount: Number,
  grossTotal: Number,
  cgstPercent: Number,
  sgstPercent: Number,
  cgst: Number,
  sgst: Number,
  roundOff: Number,
  total: Number,

terms: {
  type: [String],
  default: []
}
}, { timestamps: true });

module.exports = mongoose.model("Proposal", proposalSchema);