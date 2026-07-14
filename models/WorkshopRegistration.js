const mongoose = require("mongoose");

const TrainingRegistrationSchema = new mongoose.Schema(
  {
    trainingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Training",
      required: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    serialNumber: {
      type: String,
      default: "",
    },

    participantCount: {
      type: Number,
      default: 1,
      min: 1,
    },

    status: {
      type: String,
      enum: ["Registered", "Cancelled"],
      default: "Registered",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "TrainingRegistration",
  TrainingRegistrationSchema
);