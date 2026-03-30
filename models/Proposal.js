const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },
  name: String,

  qty: {
    type: Number,
    required: true,
    default: 1
  },

  rate: {
    type: Number,
    required: true
  },

  gst: {
    type: Number,
    default: 0
  },

  discount: {
    type: Number,
    default: 0
  },

  subtotal: Number,
  gstValue: Number,
  totalValue: Number,
  net: Number
});

const proposalSchema = new mongoose.Schema(
  {
    // 📅 BASIC DETAILS
    date: {
      type: String,
      required: true
    },

    businessLine: {
      type: String,
      required: true
    },

    priceLevel: String,

    // 🏢 COMPANY DETAILS
    company: {
      companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company"
      },
      name: String,
      address1: String,
      address2: String,
      address3: String,
      city: String,
      state: String,
      pincode: String
    },

    // 👤 CONTACT
    contact: {
      contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contact"
      },
      name: String
    },

    // 📦 PRODUCTS
    products: [productSchema],

    // 🔢 SERIALS (Tally licenses)
    selectedSerials: [String],

    // 💰 TOTALS
    totals: {
      discount: {
        type: Number,
        default: 0
      },

      subtotal: {
        type: Number,
        required: true
      },

      cgst: {
        type: Number,
        default: 0
      },

      sgst: {
        type: Number,
        default: 0
      },

      gst: {
        type: Number,
        default: 0
      },

      roundOff: {
        type: Number,
        default: 0
      },

      total: {
        type: Number,
        required: true
      },

      net: {
        type: Number,
        default: 0
      }
    },

    // 📝 TERMS
    internalTerms: String,
    specialTerms: String,
    terms: [String],

    // 👨‍💼 USER INFO
    createdBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      name: String,
      email: String,
      mobile: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Proposal", proposalSchema);