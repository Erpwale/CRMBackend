const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const jwt = require("jsonwebtoken");

const bcrypt = require("bcryptjs");
const { io } = require("../server");


// CREATE CONTACT
router.post("/create", authMiddleware, async (req, res) => {
  try {
const {
  name,
  designation,
  mobile,
  email,  
  primary,

  replacePrimary,
  contactType
} = req.body;
const companyId= req.body.companyId
console.log("company Id", companyId)
console.log("cust company Id",  req.customerCompanyId)
const finalCompanyId =
  companyId ||
  req.customerCompanyId;
    // ---------- VALIDATIONS ----------
    if (!name || !mobile || !email || !designation) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (!/^[A-Za-z\s]+$/.test(name)) {
      return res.status(400).json({
        success: false,
        message: "Name must contain only letters"
      });
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits"
      });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }
if (
  contactType &&
  !["employee", "customer"].includes(contactType)
) {
  return res.status(400).json({
    success: false,
    message: "Invalid contact type"
  });
}
    // ---------- DUPLICATE CHECK ----------
    const existingContact = await Contact.findOne({ mobile })
      .populate("companyId", "companyName");

    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: `Contact already exists in company: ${existingContact.companyId?.companyName}`
      });
    }

    const existingMail = await Contact.findOne({ email })
      .populate("companyId", "companyName");

    if (existingMail) {
      return res.status(400).json({
        success: false,
        message: `Email already exists in company: ${existingMail.companyId?.companyName}`
      });
    }

    // ---------- PRIMARY LOGIC ----------
    if (primary) {
      const existingPrimary = await Contact.findOne({
        companyId: finalCompanyId,
        primary: true
      });

      if (existingPrimary) {
        if (!replacePrimary) {
          return res.status(400).json({
            message: `Primary contact already exists (${existingPrimary.name})`
          });
        }

        // ✅ Remove old primary
        await Contact.updateOne(
          { _id: existingPrimary._id },
          { $set: { primary: false } }
        );
      }
    }

    // ---------- CREATE ----------
const contact = new Contact({
  ...req.body,

  companyId: finalCompanyId,

  contactType:
    contactType || "employee",

  createdBy:
    req.user?._id ||
    req.customer?._id,

  createdByType:
    req.user ? "user" : "customer"
});

    await contact.save();

    const populatedContact = await Contact.findById(contact._id)
      .populate("companyId", "companyName");

    
    // ---------- SOCKET ----------
const companyRoom =
  finalCompanyId.toString();

if (global.io) {
  console.log("📡 Emitting contactUpdated to:", companyRoom);

  global.io.to(companyRoom).emit("contactUpdated", {
    type: "CREATE",
    data: populatedContact,
  });
} else {
  console.log("❌ Socket not initialized");
}

    res.status(201).json({
      success: true,
      message: "Contact created successfully",
      data: contact
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.put(
  "/accept-terms",
  async (req, res) => {
    try {

      // GET TOKEN
      const token = req.header("Authorization")?.replace(
        "Bearer ",
        ""
      );

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "No token found",
        });
      }

      // VERIFY TOKEN
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      // UPDATE USER
      const updatedUser =
        await Contact.findByIdAndUpdate(
          decoded.id,
          {
            termsAccepted: true,
          },
          {
            new: true,
          }
        );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Terms accepted successfully",
        user: updatedUser,
      });

    } catch (error) {
      console.log(error);

      return res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  }
);

// FETCH CONTACTS
router.get("/:companyId", authMiddleware, async (req, res) => {
  try {

    const contacts = await Contact.find({
      companyId: req.params.companyId
    }).sort({ _id: -1 }); // 🔥 latest first

    res.json({
      success: true,
      data: contacts
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});



// UPDATE CONTACT
router.put("/update/:id", authMiddleware, async (req, res) => {
  try {
    const { primary, companyId, replacePrimary } = req.body;
const existingContact = await Contact.findById(req.params.id);

if (
  existingContact.primary === true && // was primary before
  primary === false // user trying to remove it
) {
  const totalPrimary = await Contact.countDocuments({
    companyId,
    primary: true
  });

  if (totalPrimary === 1) {
    return res.status(400).json({
      message: "At least one primary contact is required"
    });
  }
}
// 🔥 Check if another primary exists
if (primary) {
  const existingPrimary = await Contact.findOne({
    companyId,
    primary: true
  });

  // ✅ If same contact, do nothing (no alert)
  if (existingPrimary && existingPrimary._id.toString() === req.params.id) {
    // already primary → skip everything
  } else if (existingPrimary) {

    if (!replacePrimary) {
      return res.status(400).json({
        message: `Primary contact already exists (${existingPrimary.name})`
      });
    }

    // ✅ Make old primary false
    await Contact.updateOne(
      { _id: existingPrimary._id },
      { $set: { primary: false } }
    );
  }
}
    // ✅ Update current contact
    const updated = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    // ---------- SOCKET (🔥 ADD THIS) ----------
    const companyRoom = companyId.toString();

    if (global.io) {
      console.log("📡 Emitting contactUpdated (UPDATE) to:", companyRoom);

      global.io.to(companyRoom).emit("contactUpdated", {
        type: "UPDATE",
        data: updated,
      });
    } else {
      console.log("❌ Socket not initialized");
    }

    res.json({
      message: "Contact updated successfully",
      data: updated
    });

  } catch (err) {
    res.status(500).json({ message: "Error updating contact" });
  }
});

router.post("/customer-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // FIND USER
    const customer = await Contact.findOne({ email });

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "Customer not found",
      });
    }

    // CHECK PASSWORD
    const isMatch = await bcrypt.compare(
      password,
      customer.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    // TOKEN
    const token = jwt.sign(
      {
        id: customer._id,
        email: customer.email,
          type: "customer",
         companyId: customer.companyId,
         termsAccepted: customer.termsAccepted || false
      },
         process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      token,
      customer,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});


router.put("/forgot-password", async (req, res) => {
  try {

    const { email, newPassword } = req.body;

    const customer = await Contact.findOne({ email });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // SET NEW PASSWORD
    customer.password = newPassword;

    // AUTO HASH FROM SCHEMA
    await customer.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
});

module.exports = router;