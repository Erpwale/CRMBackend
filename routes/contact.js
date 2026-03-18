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
    message: `email already exists in company: ${existingContact.companyId?.companyName}`
  });
}

    // Check if primary contact already exists in the company
    if (primary) {
      const existingPrimary = await Contact.findOne({
        companyId,
        primary: true
      });

      if (existingPrimary) {
        return res.status(400).json({
          success: false,
          message: `Primary contact already exists: ${existingPrimary.name}`
        });
      }
    }

    const contact = new Contact({
      ...req.body,
      createdBy: req.user.id
    });
    await contact.save();
    const populatedContact = await Contact.findById(contact._id)
      .populate("companyId", "companyName");

    // 🔥 REAL-TIME EMIT (AFTER SAVE)
    const companyId = companyId.toString();

   if (global.io) {
      global.io.to(companyId).emit("activityAdded", populatedActivity);
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

    const { mobile, email } = req.body;

    // Check duplicate except current contact
    const existingContact = await Contact.findOne({
      _id: { $ne: req.params.id },
      $or: [
        { mobile: mobile },
        { email: email }
      ]
    }).populate("companyId", "companyName");

    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: `Contact already exists in company: ${existingContact.companyId?.companyName}`
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      message: "Contact updated successfully",
      data: contact
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});



// DELETE CONTACT
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {

    await Contact.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Contact deleted"
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});


module.exports = router;