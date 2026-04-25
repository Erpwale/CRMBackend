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
    unique: true, // 🚀 prevents duplicate
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
    match: /^[0-9]{10}$/ // ✅ 10 digit validation
  },
  password: {
    type: String,
    required: true
  },
monthlyTargets: [
  {
    date: {
      type: String, // or Date if you prefer
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
]
  zone: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);