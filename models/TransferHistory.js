
const mongoose = require("mongoose");

const transferHistorySchema = new mongoose.Schema(
  {
    company: {
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

    companyId: {
      type: String,
      required: true,
      index: true,
    },

    previousUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    newUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    transferredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

transferHistorySchema.index({ transferredAt: -1 });
transferHistorySchema.index({ company: 1, transferredAt: -1 });
transferHistorySchema.index({ newUser: 1, transferredAt: -1 });

module.exports = mongoose.model(
  "TransferHistory",
  transferHistorySchema
);
