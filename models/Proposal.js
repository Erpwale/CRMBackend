const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  qty: Number,
  rate: Number,
  totalValue: Number
});

const proposalSchema = new mongoose.Schema({
  proposalId: {
    type: Number,
    unique: true
  },

  companyName: String,
  address1: String,
  address2: String,
  state: String,
  city: String,
  pincode: String,
  date: String,
  contactName: String,
  businessLine: String,
  products: [productSchema],

  discount: Number,
  grossTotal: Number,
  cgstPercent: Number,
  sgstPercent: Number,
  cgst: Number,
  sgst: Number,
  roundOff: Number,
  total: Number,

  terms: {
    type: [String],
    default: []
  },

  uid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  userName: String,
  email: String

}, { timestamps: true });

proposalSchema.pre("save", async function (next) {
  if (!this.proposalId) {
    let randomId;
    let exists = true;

    while (exists) {
      randomId = Math.floor(100000 + Math.random() * 900000); // 6-digit
      exists = await mongoose.models.Proposal.findOne({ proposalId: randomId });
    }

    this.proposalId = randomId;
  }
  next();
});

module.exports = mongoose.model("Proposal", proposalSchema);