const express = require("express");
const router = express.Router();
const BankAccount = require("../models/BankAccount");


// ✅ CREATE
router.post("/bank", async (req, res) => {
  try {
    const data = await BankAccount.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ GET ALL
router.get("/bank", async (req, res) => {
  try {
    const data = await BankAccount.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ UPDATE
router.put("/bank/:id", async (req, res) => {
  try {
    const data = await BankAccount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ DELETE
router.delete("/bank/:id", async (req, res) => {
  try {
    await BankAccount.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;