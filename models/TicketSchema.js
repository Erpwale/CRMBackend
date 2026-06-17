const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    tallySerialNo: String,

    category: String,

    subCategory: String,

    description: String,
 priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Low",
    },
    contactPerson: String,

    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
    },

    ticketNumber: {
      type: String,
      unique: true,
    },

    contactNumber: String,

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    preferredDate: String,

    preferredTime: String,
resolveRemark: {
  type: String,
  default: "",
},

resolvedAt: {
  type: Date,
  default: null,
},
  workStartedAt: {
  type: Date,
  default: null,
},

totalWorkSeconds: {
  type: Number,
  default: 0,
},

isWorking: {
  type: Boolean,
  default: false,
},
resolvedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},
    status: {
      type: String,
      default: "open",
    },

    // ✅ INSIDE MAIN OBJECT
    statusHistory: [
      {
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        role: {
          type: String,
        },

        oldStatus: {
          type: String,
        },

        newStatus: {
          type: String,
        },

        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Ticket", ticketSchema);