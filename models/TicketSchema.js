const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    tallySerialNo: String,

    category: String,

    subCategory: String,

    description: String,

    contactPerson: String,

    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact"
    },

    contactNumber: String,

    preferredDate: String,

    preferredTime: String,

    status: {
      type: String,
      default: "open"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Ticket", ticketSchema);