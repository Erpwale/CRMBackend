const mongoose = require("mongoose");

const bankAccountSchema = new mongoose.Schema(
  {
    bankName: { type: String, required: true },
    holderName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    branchName: { type: String, required: true },
    abaNumber: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BankAccount", bankAccountSchema);