const mongoose = require("mongoose");

const workReportSchema =
  new mongoose.Schema(
    {
      supportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      date: {
        type: String,
      },

      totalWorkSeconds: Number,

      totalBenchSeconds: Number,

      benchReasons: [String],

      loginTime: Date,

      logoutTime: Date,

      productivity: Number,
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "WorkReport",
  workReportSchema
);