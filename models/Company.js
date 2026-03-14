const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
{
  companyName: {
    type: String,
    required: true,
  },

  source: String,
  companyType: String,

  businessLine: String,
  businessType: String,
  noOfLocation: Number,
  noOfEmployee: String,
  noOfTallyUser: String,
  turnover: String,

  address: {
    line1: String,  
    zone: String,
    sector: String,
    city: String,
    state: String,
    pincode: String,
    country:String
  },

  primaryContact: {
    name: {
      type:String,
       required: true,
    unique: true
  }

    contactNumber: {
      type: String,
      required: true,
      unique: true,
    },

    contactEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    designation: String,
  },

  tallyLicense: {
    srNo: String,
    licenseType: String,
    tssDate: Date,
    location: String
  },

  remark: String,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Company", companySchema);