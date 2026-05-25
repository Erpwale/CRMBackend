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
ticketNumber: {
      type: String,
      unique: true
    },

    contactNumber: String,
assignedTo: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null
},

assignedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null
},

assignedAt: {
  type: Date,
  default: null
},
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

// await TicketMessage.create({
//   ticketId: ticket._id,
//   senderId: customerId,
//   senderType: "customer",
//   message: description,
// });

module.exports = mongoose.model("Ticket", ticketSchema);