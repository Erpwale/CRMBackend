import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company", // optional
      required: true,
      index: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

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

export default mongoose.model("Ledger", ledgerSchema);