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

 // ✅ WHO CREATED THIS CONTACT
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },

    // ✅ CREATED BY USER OR CUSTOMER
    createdByType: {
      type: String,
      enum: ["user", "customer"],
       default: "user"
      required: false

    },

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