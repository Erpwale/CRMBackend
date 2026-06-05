const mongoose = require("mongoose");

const bcrypt = require("bcryptjs");
const ContactSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    name: String,
    mobile: String,
    email: String,
    designation: String,
       password: {
      type: String,
      // required: true,
    },
     termsAccepted: {
    type: Boolean,
    default: false
  },

 // ✅ WHO CREATED THIS CONTACT
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },

    // ✅ CREATED BY USER OR CUSTOMER
    createdByType: {
      type: String,
      enum: ["user", "customer"],
       default: "user"


    },
      salutation: {
    type: String,
    enum: ["Mr.", "Ms.", "Mrs.", "Dr."],
    default: "Mr."
  },
    inactive: {
      type: Boolean,
      default: false
    },

    autoMail: {
      type: Boolean,
      default: true
    },

    primary: {
      type: Boolean,
      default: false
    },

    serviceSpoc: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

ContactSchema.pre("save", async function () {

  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(
    this.password,
    salt
  );
});



module.exports = mongoose.model("Contact", ContactSchema);