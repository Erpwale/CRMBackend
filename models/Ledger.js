const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    // ✅ CONTACT DETAILS
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
    },
    contactName: String,
    contactMobile: String,
    contactEmail: String,

    // ✅ ADDRESS
    address1: String,
    address2: String,
    address3: String,
    state: String,
    district: String,
    city: String,
    pincode: String,

    // ✅ GST DETAILS
    gstType: String,
    gstin: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    pan: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    tan: {
      type: String,
      uppercase: true,
      trim: true,
    },

    msme: {
      type: String,
      uppercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ledger", ledgerSchema);