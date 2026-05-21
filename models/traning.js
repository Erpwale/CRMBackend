const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    short: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Training", trainingSchema);