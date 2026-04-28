const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    receiptNo: { type: String, unique: true },

    date: { type: Date, default: Date.now },

    companyName: { type: String, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },

    salesOrders: [
      {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "SalesOrder" },

        orderNo: String,
        orderAmount: Number,
        billAmount: Number,

        receivedAmount: Number,
        tdsPercent: Number,
        tdsAmount: Number,

        pendingBefore: Number,
        pendingAfter: Number,
      },
    ],

    totalReceived: { type: Number, default: 0 },
    totalTDS: { type: Number, default: 0 },

    advanceAmount: { type: Number, default: 0 },

    paymentMode: String,
    utrNumber: String,

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("receipt", receiptSchema);