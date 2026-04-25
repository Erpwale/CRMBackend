const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/
  },
  password: {
    type: String,
    required: true
  },

  monthlyTargets: [
    {
      date: {
        type: String,
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      revise: {
        type: String,
        default: "Per Month"
      }
    }
  ],

  zone: {
    type: String,
    required: true
  },

  // ✅ ADD THESE (this is your fix)
  twoFactorSecret: {
    type: String,
    default: null
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);