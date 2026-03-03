const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: String,
  role: {
    type: String,
    enum: ["admin", "manager", "employee"], // only allowed roles
    required: true
  },
  twoFactorSecret: String,
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);