const mongoose = require("mongoose");


// ✅ PRODUCT (with AMC)
const productSchema = new mongoose.Schema({
  name: String,
  description: { type: String, default: "" },

  tallySerials: {
    type: [String],
    default: []
  },

  amcDetails: {
    subType: String,
    licenseNo: String,
    licenseType: String,
    location: String,
    periodFrom: String,
    periodTo: String,

    supportType: String,
    users: String,
    inventoryType: String,
    syncASC: String,

    ascValue: Number,
    addonASC: Number,
    customizationASC: Number,
    syncValue: Number,
    remoteValue: Number,
  },

  qty: Number,
  rate: Number,

  gst: { type: Number, default: 0 },
  gstValue: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  totalValue: Number,

  terms: {
    type: [String],
    default: []
  }
});


// ✅ BANK DETAILS
const bankSchema = new mongoose.Schema({
  bankName: String,
  accountNumber: String,
  ifsc: String,
  branch: String,
  holderName: String
});


// ✅ SALES ORDER (FINAL)
const salesOrderSchema = new mongoose.Schema(
{
  // 🔹 Proposal Info
  proposalId: Number,
  companyName: String,
  priceLevel: String,
  businessLine: String,

  tallySerials: {
    type: [String],
    default: []
  },

  // 🔹 Ledger / Party Info
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company"
  },

  contactName: String,
  contactMobile: String,
  contactEmail: String,

  address1: String,
  address2: String,
  address3: String,
  state: String,
  district: String,
  city: String,
  pincode: String,

  gstType: String,
  gstin: String,
  pan: String,
  tan: String,
  msme: String,

  // 🔹 Order Info
  orderNo: String,
  orderDate: String,

  userName: String,
  salesTeam: String,

  // 🔹 Products (FULL COPY)
  products: [productSchema],

  // 🔹 Financials (FROM FRONTEND)
  discount: Number,
  grossTotal: Number,
  cgstPercent: Number,
  sgstPercent: Number,
  cgst: Number,
  sgst: Number,
  roundoff: Number,
  subtotal: Number,
  net: Number,

  // 🔹 Terms
  internalTerms: String,
  specialTerms: String,

  // 🔹 Bank Details
  bankDetails: bankSchema,

  narration: String
},
{ timestamps: true }
);

module.exports = mongoose.model("SalesOrder", salesOrderSchema);