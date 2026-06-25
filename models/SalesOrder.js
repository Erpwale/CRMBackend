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
  hsn: Number,
  qty: Number,
  rate: Number,

  gst: { type: Number, default: 0 },
  gstValue: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  totalValue: Number,
tallyStatus: {
  type: String,
  enum: ["Pending", "Synced", "Failed"],
  default: "Pending"
},

tallySyncedAt: {
  type: Date,
  default: null
},

tallyError: {
  type: String,
  default: ""
},
  terms: {
    type: [String],
    default: []
  },

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
payments: [
  {
    amount: Number,
    tdsPercent: Number,
    tdsAmount: Number,
    paymentMode: String,
    utrNumber: String,
    date: {
      type: Date,
      default: Date.now
    }
  }
], // ✅ FIXED

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

  narration: String,
    // 🔹 Billing / Invoice Info
isBill: { type: Boolean, default: false },   // Invoice created or not
isOutstanding: { type: Boolean, default: true }, // Pending or cleared

invoiceNo: { type: String, default: "" },
invoiceDate: { type: String, default: "" },

invoiceAmount: { type: Number, default: 0 },

receivedAmount: { type: Number, default: 0 },
pendingAmount: { type: Number, default: 0 },
billRequestCount: {
  type: Number,
  default: 0,
},
status: {
  type: String,
  default: "Active" // Active, Cancelled
},
latestBillRequestStatus: {
  type: String,
  default: "",
},
},
{ timestamps: true }
);

salesOrderSchema.post("save", async function (doc) {
  try {
    const SalesOrder = mongoose.model("SalesOrder");

    // Check if ANY sales order for this company qualifies
    const hasLiveOrder = await SalesOrder.exists({
      companyId: doc.companyId,
      isBill: true,
      isOutstanding: false,
    });

    await mongoose.model("Company").findByIdAndUpdate(
      doc.companyId,
      {
        status: hasLiveOrder ? "live" : "not live",
      }
    );
  } catch (err) {
    console.log("Company status update error:", err);
  }
});
module.exports = mongoose.model("SalesOrder", salesOrderSchema);