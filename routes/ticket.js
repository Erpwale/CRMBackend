const Contact = require("../models/Contact");
const SalesOrder = require("../models/SalesOrder");
const Company = require("../models/Company");
const express = require("express");
const router = express.Router();

router.post("/get-full-details", async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile number required" });
    }

    // 1. Find Contact using mobile
    const contact = await Contact.findOne({ mobile });

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // 2. Get Company using companyId
    const company = await Company.findById(contact.companyId);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // 3. Get Sales Orders using companyId
     const salesOrders = await SalesOrder.find({
      companyName: company.companyName
    });

    // 4. Return everything
    res.json({
      contact,
      company,
      salesOrders,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;