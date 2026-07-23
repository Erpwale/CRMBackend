const express = require("express");
const router = express.Router();
const Lead = require("../models/Lead");
const sendNotification = require("../utils/sendNotification");
const logActivity = require("../utils/Activitylog");
const { authMiddleware } = require("../middleware/auth");
// CREATE LEAD
router.post("/create", authMiddleware, async (req, res) => {
    try {
    const lead = await Lead.create(req.body);
    await logActivity({
  req,
  userId: req.user.id,
  module: "LEAD",
  action: "CREATE",
  description: `Created lead ${lead.companyName}`,
  recordId: lead._id,
  recordName: lead.companyName,
});
    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// GET ALL LEADS
router.get("/", async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// GET SINGLE LEAD
router.get("/:id", async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// UPDATE LEAD
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { status, remark, addedBy } = req.body;

    const updateData = {
      status,
    };

    if (remark && remark.trim() !== "") {
      updateData.$push = {
        remark: {
          text: remark,
          addedBy,
          addedAt: new Date(),
        },
      };
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }
await logActivity({
  req,
  userId: req.user.id,
  module: "LEAD",
  action: "UPDATE",
  description: remark
    ? `Added remark to lead ${lead.companyName}`
    : `Updated lead ${lead.companyName}`,
  recordId: lead._id,
  recordName: lead.companyName,
});
    res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// DELETE LEAD
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }
    await logActivity({
  req,
  userId: req.user.id,
  module: "LEAD",
  action: "DELETE",
  description: `Deleted lead ${lead.companyName}`,
  recordId: lead._id,
  recordName: lead.companyName,
});

    res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;