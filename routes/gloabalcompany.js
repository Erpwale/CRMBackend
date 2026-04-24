const express = require("express");
const router = express.Router();

const Company = require("../models/globalcompany");

// ✅ CREATE or UPDATE (single company)
router.post("/company", async (req, res) => {
  try {
    // check if company already exists
    const existingCompany = await Company.findOne();

    if (existingCompany) {
      // 🔁 UPDATE
      const updated = await Company.findOneAndUpdate(
        {},
        req.body,
        { new: true }
      );

      return res.status(200).json({
        message: "Company updated successfully",
        data: updated
      });
    }

    // 🆕 CREATE (only first time)
    const newCompany = await Company.create(req.body);

    return res.status(201).json({
      message: "Company created successfully",
      data: newCompany
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});


// ✅ GET company (for prefill in frontend)
router.get("/company", async (req, res) => {
  try {
    const company = await Company.findOne();
    res.json(company || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;