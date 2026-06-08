const mongoose = require("mongoose");

const monthlyTargetSchema = new mongoose.Schema({
  date: {
    type: String
  },
  amount: {
    type: Number
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

    activeTickets: {
      type: Number,
      default: 0
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

    monthlyTargets: {
      type: [monthlyTargetSchema],
      required: function () {
        return (
          this.role === "Sales Manager" ||
          this.role === "Sales Person"
        );
      },
      default: []
    },

    zones: [
      {
        type: String
      }
    ],

    joiningDate: {
      type: String,
      default: ""
    },

    // Email Configuration
    mailPassword: {
      type: String,
      default: ""
    },

    mailApiKey: {
      type: String,
      default: ""
    },

    // Personal Details
    address: {
      type: String,
      default: ""
    },

    city: {
      type: String,
      default: ""
    },

    state: {
      type: String,
      default: ""
    },

    pincode: {
      type: String,
      default: ""
    },

    bloodGroup: {
      type: String,
      default: ""
    },

    emergencyNumber: {
      type: String,
      default: ""
    },

    // Social Links
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

    // Profile
    profileImage: {
      type: String,
      default: ""
    },

    // 2FA
    twoFactorSecret: {
      type: String,
      default: null
    },
status: {
  type: String,
  enum: ["Active", "Inactive"],
  default: "Active"
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