const express = require("express");
const router = express.Router();
const Bank = require("../models/Bank");


// =========================
// Create Bank
// =========================
router.post("/", async (req, res) => {
  try {
    const bank = await Bank.create(req.body);

    res.status(201).json({
      success: true,
      message: "Bank Created Successfully",
      bank,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// =========================
// Get All Banks
// =========================
router.get("/", async (req, res) => {
  try {
    const banks = await Bank.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      banks,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// =========================
// Get Single Bank
// =========================
router.get("/:id", async (req, res) => {
  try {
    const bank = await Bank.findById(req.params.id);

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: "Bank Not Found",
      });
    }

    res.json({
      success: true,
      bank,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// =========================
// Update Bank
// =========================
router.put("/:id", async (req, res) => {
  try {
    const bank = await Bank.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    res.json({
      success: true,
      message: "Bank Updated Successfully",
      bank,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// =========================
// Change Status
// =========================
router.patch("/status/:id", async (req, res) => {
  try {
    const bank = await Bank.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Status Updated",
      bank,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// =========================
// Delete Bank
// =========================
router.delete("/:id", async (req, res) => {
  try {
    await Bank.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Bank Deleted Successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;