const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    createdBy: {
      type: String,
      required: true,
    },

    source: {
      type: String,
      required: true,
    },

    interest: {
      type: String,
      required: true,
    },

    contactName: {
      type: String,
      required: true,
    },

    mobile: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      default: "",
    },

    serialNo: {
      type: String,
      default: "",
    },

    details: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Qualified",
        "Proposal Sent",
        "Won",
        "Lost",
      ],
      default: "New",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Lead", leadSchema);