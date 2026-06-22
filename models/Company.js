const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
{
  companyId: {
    type: String,
    unique: true
  },

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
    district: String,
    state: String,
    pincode: String,
    country: String
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
      name: String
    }
  ],

  status: {
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
companySchema.pre("save", async function () {
  if (!this.isNew || this.companyId) return;

  const lastCompany = await mongoose
    .model("Company")
    .findOne({
      companyId: /^DP-\d+$/
    })
    .sort({ companyId: -1 });

  let nextNumber = 100;

  if (lastCompany?.companyId) {
    nextNumber =
      parseInt(lastCompany.companyId.split("-")[1]) + 1;
  }

  this.companyId = `DP-${nextNumber}`;
});


module.exports = mongoose.model("Company", companySchema);