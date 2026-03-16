const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
{
  type: {
    type: String,
    enum: ["Call", "Email", "Meeting", "Demo", "FollowUp"],
    required: true
  },

  regarding: {
    type: String,
    required: true,
    trim: true
  },

  details: {
    type: String,
    required: true
  },

  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact",
    required: true
  },

  nextFollowupDate: {
    type: String
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);