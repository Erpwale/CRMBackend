const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema({
  state: String,
  district: String,
  city: String,
  pincode: Number,
});

module.exports = mongoose.model("Location", LocationSchema);