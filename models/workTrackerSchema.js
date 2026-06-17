const mongoose = require("mongoose");

const workBenchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  date: String,

  currentStatus: {
    type: String,
    enum: ["work", "bench"],
    default: "bench",
  },

  benchReason: {
    type: String,
    default: "",
  },

  benchRemark: {
    type: String,
    default: "",
  },

  statusStartedAt: Date,

  totalWorkSeconds: {
    type: Number,
    default: 0,
  },

  totalBenchSeconds: {
    type: Number,
    default: 0,
  },
  

  history: [
    {
      status: String,
      reason: String,
      remark: String,
      startTime: Date,
      endTime: Date,
      durationSeconds: Number,
    },
  ],
});

module.exports = mongoose.model("WorkBench", workBenchSchema);