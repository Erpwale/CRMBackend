const Contact = require("../models/Contact");
const SalesOrder = require("../models/SalesOrder");
const Company = require("../models/Company");
const User = require("../models/User");
const express = require("express");
const router = express.Router();

router.post("/get-full-details", async (req, res) => {
  try {
        const { search } = req.body;

    if (!search) {
      return res.status(400).json({
        message: "Mobile or email is required"
      });
    }

    // 1. Find contact using mobile OR email
    const contact = await Contact.findOne({
      $or: [
        { mobile: search },
        { email: search }
      ]
    });

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found"
      });
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
   const user = await User.findById(company.createdBy).select("firstName lastName");;

    // 4. Return everything
    res.json({
      contact,
      company,
      salesOrders,
      user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;