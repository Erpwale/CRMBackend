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
    district:String,
    state: String,
    pincode: String,
    country:String
  },

primaryContact: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Contact"
},

 tallyLicense: [
    {
      srNo: String,
      licenseType: String,
      tssDate: Date,
      location: String,
      name:String
    }
  ],us: {
    type: String,
    enum: ["live", "not live"],
    default: "not live"
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