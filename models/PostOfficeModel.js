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

// 🚀 Indexes for fast queries
PostOfficeSchema.index({ statename: 1 });
PostOfficeSchema.index({ district: 1 });
PostOfficeSchema.index({ officename: 1 });
PostOfficeSchema.index({ pincode: 1 });

module.exports = mongoose.model("PostOffice", PostOfficeSchema);