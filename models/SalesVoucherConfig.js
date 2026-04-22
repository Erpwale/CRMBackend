// models/VoucherConfig.js
const mongoose = require("mongoose");

const salesvoucherConfigSchema = new mongoose.Schema({
  startingNumber: { type: Number, default: 1 },
  width: { type: Number, default: 3 },
  prefillZero: { type: Boolean, default: true },

  restart: {
    applicableFrom: String, // "2026-04-01"
    startingNumber: Number,
    periodicity: {
      type: String,
      enum: ["Yearly", "Monthly", "Never"],
      default: "Yearly",
    },
  },

  prefix: {
    applicableFrom: String,
    value: String,
  },

  suffix: {
    applicableFrom: String,
    value: String,
  },

  currentNumber: { type: Number, default: 1 }, // running counter
}, { timestamps: true });

module.exports = mongoose.model("SalesVoucherConfig", salesvoucherConfigSchema);