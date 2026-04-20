const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  license: { type: String, default: "" },
  qty: { type: Number, required: true, min: 1 },
  rate: { type: Number, required: true, min: 0 },
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
      required: true,
      validate: [(val) => val.length > 0, "At least 1 product required"]
    },
tallySerials: {
  type: [String],
  default: []
},
    cgst: { type: Number, required: true, min: 0 },
    sgst: { type: Number, required: true, min: 0 },
    net: { type: Number, required: true, min: 0 },

    narration: { type: String, default: "" } // ✅ optional
  },
  { timestamps: true }
);

module.exports = mongoose.model("SalesOrder", salesOrderSchema);