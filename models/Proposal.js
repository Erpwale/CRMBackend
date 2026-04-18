const mongoose = require("mongoose");
const Counter = require("./Counter")

const productSchema = new mongoose.Schema({
  name: String,

  description: { type: String, default: "" },

  tallySerials: {
    type: [String],
    default: []
  },

  // ✅ MOVE AMC HERE
  amcDetails: {
    subType: String,
    licenseNo: String,
    licenseType: String,
    periodFrom: String,
    periodTo: String,

    supportType: String,
    users: String,
    inventoryType: String,
    syncASC: String,

    ascValue: Number,
    addonASC: Number,
    customizationASC: Number,
    syncValue: Number,
    remoteValue: Number,
  },

  qty: Number,
  rate: Number,

  gst: { type: Number, default: 0 },
  gstValue: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  totalValue: Number,

  terms: {
    type: [String],
    default: []
  }
});


const proposalSchema = new mongoose.Schema({
  proposalId: {
    type: Number,
    unique: true
  },

  companyName: String,
  tallySerials: {
  type: [String],
  default: []
},
statusDetails: {
  statusDate: {
    type: String,
    default: () => new Date().toISOString().split("T")[0],
  },
  status: {
    type: String,
    default: "Open",   // ✅ DEFAULT STATUS
  },
  postponedDate: String,
  closeReason: String,
  closeRemark: String,
},
proposalStatus: {
  type: Boolean,
  default: false
},
  address1: String,
  address2: String,
  state: String,
  city: String,
  district: String,
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
  subtotal: Number,
  net: Number,

  internalTerms: String,
  specialTerms: String,

  // ✅ ADD BANK DETAILS HERE
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifsc: String,
    branch: String,
    holderName:String,
  },

  uid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  userName: String,
  email: String,

}, { timestamps: true });
proposalSchema.pre("save", async function () {



  // ✅ YOUR EXISTING COUNTER LOGIC (unchanged)
  if (this.isNew && !this.proposalId) {
    const counter = await Counter.findByIdAndUpdate(
      "proposalId",
      { $inc: { seq: 8999 } },
      { returnDocument: "after", upsert: true }
    );

    this.proposalId = counter.seq;
  }
});
module.exports = mongoose.model("Proposal", proposalSchema);