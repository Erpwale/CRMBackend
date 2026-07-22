const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    module: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    recordName: {
      type: String,
      default: "",
    },
    ipAddress: String,
    browser: String,
    device: String,
    os: String,
    route: String,
    method: String,
    status: {
      type: String,
      default: "Success",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activitySchema);