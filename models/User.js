const mongoose = require("mongoose");

const monthlyTargetSchema = new mongoose.Schema({
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
    enum: ["Per Month", "Per Year"],
    default: "Per Month"
  }
});

const userSchema = new mongoose.Schema(
  {
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
      unique: true,
      lowercase: true
    },

    role: {
      type: String,
      required: true
    },

    department: {
      type: String,
      required: true
    },
    team: {
  type: String,
  required: true,
  trim: true
},

    reportingManager: {
      type: String,
      default: ""
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

    monthlyTargets: [monthlyTargetSchema],

    zones: [
      {
        type: String
      }
    ],

    joiningDate: {
      type: String,
      default: ""
    },

    linkedinLink: {
      type: String,
      default: ""
    },

    whatsappLink: {
      type: String,
      default: ""
    },

    calendlyLink: {
      type: String,
      default: ""
    },

    profileImage: {
      type: String,
      default: ""
    },

    // 2FA
    twoFactorSecret: {
      type: String,
      default: null
    },

    isTwoFactorEnabled: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);