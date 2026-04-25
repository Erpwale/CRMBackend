const mongoose = require("mongoose");

const globalSchema = new mongoose.Schema({
  companyName: String,
  email: String,
  phone: String,
  gstin: String,
  msme: String,
  pan: String,
  placeOfSupply: String,

  address: {
    line1: String,
    line2: String,
    line3: String,
    country: String,
    state: String,
    city: String,
    pincode: String,
  }
}, { timestamps: true });

module.exports = mongoose.model("GlobalCompany", globalSchema);