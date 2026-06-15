const mongoose = require("mongoose");

const cancelOrderSchema = new mongoose.Schema(
{
  salesOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SalesOrder",
    required: true,
  },

  // Snapshot Data
  orderNo: String,
  companyName: String,
  businessLine: String,
  orderAmount: Number,
  receivedAmount: Number,
  pendingAmount: Number,

  refundAmount: Number,

  refundStatus: {
    type: String,
    enum: ["Pending", "Processed"],
    default: "Pending",
  },

  cancelReason: String,
  cancelledBy: String,

  cancelledDate: {
    type: Date,
    default: Date.now,
  },
},
{
  timestamps: true,
}
);

module.exports = mongoose.model("CancelOrder", cancelOrderSchema);