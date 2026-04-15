const mongoose = require("mongoose");
const Counter = require("./Counter")

const productSchema = new mongoose.Schema({
  name: String,
description: { type: String, default: "" },
  qty: Number,
  rate: Number,
  totalValue: Number,
  // ✅ ADD THIS
  terms: {
    type: [String],
    default: []
  }
});

const proposalSchema = new mongoose.Schema({
  proposalId: {
    type: Number,
    unique: true
  },

  companyName: String,
  address1: String,
  address2: String,
  state: String,
  city: String,
  district: String,
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
  subtotal: Number,
  net: Number,

  internalTerms: String,
  specialTerms: String,

  // ✅ ADD BANK DETAILS HERE
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifsc: String,
    branch: String
  },

  uid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  userName: String,
  email: String

}, { timestamps: true });
proposalSchema.pre("save", async function () {
  if (this.isNew && !this.proposalId) {
    const counter = await Counter.findByIdAndUpdate(
      "proposalId",
      { $inc: { seq: 8999 } },
      { returnDocument: "after", upsert: true }
    );

    this.proposalId = counter.seq;
  }
});
module.exports = mongoose.model("Proposal", proposalSchema);