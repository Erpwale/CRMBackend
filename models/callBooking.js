const mongoose = require("mongoose");

const callBooking = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    userList: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    callMode: String,
    contactAddress: String,
    contactMail: String,
    contactNumber: String,
    contactPerson: String,
    customerNote: String,

    dateTime: {
      type: Date,
      required: true,
    },

    natureOfCall: String,
    natureofsupport: String,

    priority: {
      type: String,
      enum: ["Free", "Paid"],
      default: "Free",
    },

    schedule: String,

    supportNote: String,
    tallySerialNumber: String,

    typeOfCall: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },

    allocateTo: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CallBokking", callBooking);