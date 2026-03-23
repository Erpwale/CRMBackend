const mongoose = require("mongoose");

const PostOfficeSchema = new mongoose.Schema({
  circlename: String,
  regionname: String,
  divisionname: String,
  officename: String,
  pincode: Number,
  officetype: String,
  delivery: String,
  district: String,
  statename: String,
  latitude: Number,
  longitude: Number,
});

module.exports = mongoose.model("PostOffice", PostOfficeSchema);