const express = require("express");
const router = express.Router();
const Support = require("../models/callBooking");
const { authMiddleware, adminOnly } = require("../middleware/auth");

// ✅ CREATE
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const {
      companyId,
      contactNumber,
      dateTime,
    } = req.body;

    if (!companyId || !contactNumber || !dateTime) {
      return res.status(400).json({
        success: false,
        message: "companyId, contactNumber, dateTime required",
      });
    }

    const support = await Support.create({
      ...req.body,
      createdBy: req.user?.id,
    });
await logActivity({
  req,
  userId: req.user.id,
  module: "CALL_BOOKING",
  action: "CREATE",
  description: `Created call booking for contact ${contactNumber}`,
  recordId: support._id,
  recordName: contactNumber,
});
    res.status(201).json({
      success: true,
      message: "Support created",
      data: support,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


// ✅ GET ALL BY COMPANY
router.get("/company/:companyId", authMiddleware, async (req, res) => {
  try {
    const supports = await Support.find({
      companyId: req.params.companyId,
    })
      .populate("allocateTo", "name email")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: supports.length,
      data: supports,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ✅ GET SINGLE
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const support = await Support.findById(req.params.id)
      .populate("allocateTo", "name email")
      .populate("createdBy", "name");

    if (!support) {
      return res.status(404).json({
        success: false,
        message: "Support not found",
      });
    }

    res.json({
      success: true,
      data: support,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ✅ UPDATE
router.put("/update/:id", authMiddleware, async (req, res) => {
  try {
    const updated = await Support.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
await logActivity({
  req,
  userId: req.user.id,
  module: "CALL_BOOKING",
  action: "UPDATE",
  description: `Updated call booking for ${updated.contactNumber}`,
  recordId: updated._id,
  recordName: updated.contactNumber,
});
    res.json({
      success: true,
      message: "Updated successfully",
      data: updated,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ✅ DELETE
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    await Support.findByIdAndDelete(req.params.id);
await logActivity({
  req,
  userId: req.user.id,
  module: "CALL_BOOKING",
  action: "DELETE",
  description: `Deleted call booking for ${support.contactNumber}`,
  recordId: support._id,
  recordName: support.contactNumber,
});
    res.json({
      success: true,
      message: "Deleted successfully",
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;