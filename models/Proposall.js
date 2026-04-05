// models/Proposal.js
const mongoose = require("mongoose");

const proposallSchema = new mongoose.Schema(
  {
    documentTitle: {
      type: String,
      required: true,
      trim: true,
    },
    businessLine: {
      type: String,
      required: true,
    },
    user: {
      type: String,
      required: true,
    },
    mailStatus: {
      type: String,
      enum: ["Sent", "Pending", "Failed"],
      default: "Pending",
    },
  },
  {
    timestamps: true, // ✅ gives createdAt automatically
  }
);

module.exports = mongoose.model("Proposall", proposallSchema);