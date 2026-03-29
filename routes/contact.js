const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const { authMiddleware, adminOnly } = require("../middleware/auth");

const { io } = require("../server");


// CREATE CONTACT
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const {name,designation , mobile, email, primary, companyId } = req.body;
// ---------- REQUIRED FIELD VALIDATION ----------
    if (!name || !mobile || !email || !designation) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // ---------- NAME VALIDATION ----------
    if (!/^[A-Za-z\s]+$/.test(name)) {
      return res.status(400).json({
        success: false,
        message: "Name must contain only letters"
      });
    }

    // ---------- MOBILE VALIDATION ----------
    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits"
      });
    }

    // ---------- EMAIL VALIDATION ----------
   if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }
    // Check duplicate contact by mobile/email
    const existingContact = await Contact.findOne({
      $or: [{ mobile }]
    }).populate("companyId", "companyName");

    const existingMail = await Contact.findOne({
      $or: [ { email }]
    }).populate("companyId", "companyName");

    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: `Contact already exists in company: ${existingContact.companyId?.companyName}`
      });
    }
 if (existingMail) {
  return res.status(400).json({
    success: false,
message: `Email already exists in company: ${existingMail.companyId?.companyName}`  });
}

    // Check if primary contact already exists in the company
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
      }
    }

    const contact = new Contact({
      ...req.body,
      createdBy: req.user.id
    });
    await contact.save();
    const populatedContact = await Contact.findById(contact._id)
      .populate("companyId", "companyName");
 
 
      
      console.log("company ID" , companyId)

    if (global.io) {
      console.log("Socket  initialized",populatedContact);
      global.io.to(companyId).emit("contactUpdated", populatedContact);
      console.log("Socket  contactUpdated",contactUpdated);
      } else {
  console.log("❌ Socket not initialized");
      }

    res.status(201).json({
      success: true,
      message: "Contact created successfully",
      data: contact
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


// FETCH CONTACTS
router.get("/:companyId", authMiddleware, async (req, res) => {
  try {

    const contacts = await Contact.find({
      companyId: req.params.companyId
    });

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

    res.json({
      message: "Contact updated successfully",
      data: updated
    });

  } catch (err) {
    res.status(500).json({ message: "Error updating contact" });
  }
});

module.exports = router;