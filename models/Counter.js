// models/Counter.js
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 8999 } // so first becomes 9000
});

module.exports = mongoose.model("Counter", counterSchema);