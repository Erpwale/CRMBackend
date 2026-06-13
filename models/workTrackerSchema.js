const mongoose = require("mongoose");

const workReportSchema = new mongoose.Schema({
  name: String,

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
});
module.exports = mongoose.model(
  "WorkReport",
  workReportSchema
);