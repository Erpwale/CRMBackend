const mongoose = require("mongoose");

const ticketMessageSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    senderType: {
      type: String,
      enum: ["customer", "Support Executive", "system"],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    attachments: [String],

    isInternalNote: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "TicketMessage",
  ticketMessageSchema
);