const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const { authMiddleware, adminOnly } = require("../middleware/auth");




// CREATE CONTACT
router.post("/create", authMiddleware, async (req, res) => {
  try {

    const contact = new Contact({
      ...req.body,
      createdBy: req.user.id
    });

    await contact.save();

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
router.get("/:companyId", auth, async (req, res) => {
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
router.put("/update/:id", auth, async (req, res) => {
  try {

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      message: "Contact updated",
      data: contact
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});



// DELETE CONTACT
router.delete("/delete/:id", auth, async (req, res) => {
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