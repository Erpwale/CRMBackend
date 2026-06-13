const mongoose = require("mongoose");

const workBenchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: String, // 6/13/2026
      required: true,
    },

    currentStatus: {
      type: String,
      enum: ["work", "bench"],
      default: "bench",
    },

    statusStartedAt: {
      type: Date,
      default: Date.now,
    },

    totalWorkSeconds: {
      type: Number,
      default: 0,
    },

    totalBenchSeconds: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkBench", workBenchSchema);