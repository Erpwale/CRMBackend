const mongoose = require("mongoose");

const ticketFeedbackSchema = new mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      trim: true,
      default: "",
    },
    customerName: String,
    supportExecutive: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TicketFeedback", ticketFeedbackSchema);