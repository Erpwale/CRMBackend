const mongoose = require("mongoose");

const ticketCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1999 }
});

module.exports = mongoose.model("TicketCounter", ticketCounterSchema);