const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  username: {
    type: String
  },

  role: {
    type: String
  },

  action: {
    type: String,
    required: true
  },

  module: {
    type: String
  },

  details: {
    type: String
  },


ipAddress: {
  type: String
},

location: {
  type: String
},

coordinates: {
  lat: Number,
 lng: Number
},
  loginTime: {
    type: Date
  },

  logoutTime: {
    type: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model(
  "History",
  historySchema
);