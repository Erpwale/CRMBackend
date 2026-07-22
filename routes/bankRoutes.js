const express = require("express");
const router = express.Router();
const BankAccount = require("../models/BankAccount");

const logActivity = require("../utils/Activitylog");
const { authMiddleware } = require("../middleware/auth");
// ✅ CREATE
router.post("/bank", authMiddleware, async (req, res) => {
  try {
    const data = await BankAccount.create(req.body);

    await logActivity({
      req,
      userId: req.user.id,
      module: "BANK_ACCOUNT",
      action: "CREATE",
      description: `Created bank account ${data.bankName}`,
      recordId: data._id,
      recordName: data.bankName,
    });

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
router.put("/bank/:id", authMiddleware, async (req, res) => {
  try {
    const data = await BankAccount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    await logActivity({
      req,
      userId: req.user.id,
      module: "BANK_ACCOUNT",
      action: "UPDATE",
      description: `Updated bank account ${data.bankName}`,
      recordId: data._id,
      recordName: data.bankName,
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ DELETE
router.delete("/bank/:id", authMiddleware, async (req, res) => {
  try {
    const data = await BankAccount.findById(req.params.id);

    await logActivity({
      req,
      userId: req.user.id,
      module: "BANK_ACCOUNT",
      action: "DELETE",
      description: `Deleted bank account ${data.bankName}`,
      recordId: data._id,
      recordName: data.bankName,
    });

    await BankAccount.findByIdAndDelete(req.params.id);

    res.json({
      message: "Deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;