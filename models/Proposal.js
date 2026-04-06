const mongoose = require("mongoose");
const Counter = require("./Counter")

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
  // mobile: String

}, { timestamps: true });

proposalSchema.pre("save", async function (next) {
  try {
    if (this.isNew && !this.proposalId) {
      const counter = await Counter.findByIdAndUpdate(
        "proposalId",                 // sequence name
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      this.proposalId = counter.seq; // 9000, 9001, 9002...
    }

    next();
  } catch (error) {
    next(error);
  }
});
module.exports = mongoose.model("Proposal", proposalSchema);