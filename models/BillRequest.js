const mongoose = require("mongoose");

const billRequestSchema = new mongoose.Schema(
  {
    salesOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesOrder",
      required: true,
    },

    orderNo: String,

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },

    companyName: String,

    requestedBy: String,

    requestedDate: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed"],
      default: "Pending",
    },

    remarks: String,

    approvedBy: String,

    approvedDate: Date,

    invoiceNo: {
      type: String,
      unique: true,   // Prevent duplicate invoice numbers
    
      trim: true,
    },

    invoiceDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BillRequest", billRequestSchema);