// models/Proposal.js
const mongoose = require("mongoose");

const proposallSchema = new mongoose.Schema(
  {
    proposalId: {
      type: Number,
      unique: true
    },
    opid:{
      type: Number,
      required: true
    },
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

proposallSchema.pre("save", async function () {
  if (this.isNew && !this.proposalId) {
    const counter = await Counter.findByIdAndUpdate(
      "proposallId", // ⚠️ DIFFERENT name (important)
      { $inc: { seq: 5000 } },
      { returnDocument: "after", upsert: true }
    );

    this.proposalId = counter.seq;
  }
});
module.exports = mongoose.model("Proposall", proposallSchema);