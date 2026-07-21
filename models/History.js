const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    username: String,

    role: String,

    module: {
      type: String,
      required: true,
    },

    action: {
      type: String,
      required: true,
    },

    recordId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    recordName: String,

    details: String,

    changes: [
      {
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
      },
    ],

    ipAddress: String,

    browser: String,

    location: String,

    coordinates: {
      lat: Number,
      lng: Number,
    },

    loginTime: Date,

    logoutTime: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("History", historySchema);