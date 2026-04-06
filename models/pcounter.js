// models/Counter.js
const mongoose = require("mongoose");

const pcounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 4999 } // so first becomes 9000
});

module.exports = mongoose.model("Pcounter", pcounterSchema);