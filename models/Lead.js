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
companyId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Company",
},

companyName: {
  type: String,
  required: true,
},
  remark: [
  {
    text: String,
    addedBy: String,
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
],

   status: {
  type: String,
  enum: [
    "Untouched",
    "Contacted",
    "Qualified",
    "Accepted",
    "Rejected",
  ],
  default: "Untouched",
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Lead", leadSchema);