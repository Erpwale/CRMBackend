const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema(
  {
    sessionTitle: String,

    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    trainerImage: {
      type: String,
      default: "",
    },

    duration: Number,
    startDateTime: Date,
    maxParticipants: Number,
    meetingLink: String,
    agenda: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Training", trainingSchema);