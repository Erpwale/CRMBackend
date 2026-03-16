const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    name: String,
    mobile: String,
    email: String,
    designation: String,

    inactive: {
      type: Boolean,
      default: false
    },

    autoMail: {
      type: Boolean,
      default: false
    },

    primary: {
      type: Boolean,
      default: false
    },

    serviceSpoc: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", ContactSchema);