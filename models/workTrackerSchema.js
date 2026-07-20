const mongoose = require("mongoose");

const workBenchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  date: {
    type: String,
    required: true,
  },

  currentStatus: {
    type: String,
    enum: ["work", "bench"],
    default: "work",
  },

  // Current session start times
  workStartTime: {
    type: Date,
    default: null,
  },

  benchStartTime: {
    type: Date,
    default: null,
  },

  benchReason: {
    type: String,
    default: "",
  },

  benchRemark: {
    type: String,
    default: "",
  },

  totalWorkSeconds: {
    type: Number,
    default: 0,
  },

  totalBenchSeconds: {
    type: Number,
    default: 0,
  },
logoutTime: {
  type: Date,
  default: null,
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
}, { timestamps: true });

module.exports = mongoose.model("WorkBench", workBenchSchema);