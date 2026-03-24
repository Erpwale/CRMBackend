const mongoose = require("mongoose");

const PostOfficeSchema = new mongoose.Schema({
  officename: String, // city
  pincode: Number,
  district: String,
  statename: String,
});

// 🚀 Indexes for fast queries
PostOfficeSchema.index({ statename: 1 });
PostOfficeSchema.index({ district: 1 });
PostOfficeSchema.index({ officename: 1 });
PostOfficeSchema.index({ pincode: 1 });

module.exports = mongoose.model("PostOffice", PostOfficeSchema);