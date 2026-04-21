const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  license: { type: String, default: "" },
  qty: { type: Number, required: true },
  rate: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  net: { type: Number, default: 0 }
});

const salesOrderSchema = new mongoose.Schema(
  {
    partyName: { type: String, required: true },
    address: { type: String, required: true },
    gstin: {
      type: String,
      required: true,
      match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/
    },

    priceLevel: { type: String, required: true },
    businessLine: { type: String, required: true },

    userName: { type: String, required: true },
    salesTeam: { type: String, required: true },

    orderNo: { type: String, required: true },
    orderDate: { type: String, required: true },

    products: {
      type: [productSchema],
      required: true
    },

    tallySerials: {
      type: [String],
      default: []
    },

    // ✅ FROM FRONTEND (DO NOT CALCULATE)
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    grossTotal: { type: Number, default: 0 },
    roundoff: { type: Number, default: 0 }, // ⚠️ match frontend exactly
    net: { type: Number, required: true },

    narration: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SalesOrder", salesOrderSchema);