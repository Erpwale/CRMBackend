const express = require("express");
const router = express.Router();
const Activity = require("../models/activityModel");
const { authMiddleware, adminOnly } = require("../middleware/auth");

router.post("/create",authMiddleware, async (req, res) => {
  try {
    const {
      type,
    regarding,
      activityDetails,
      contactNumber,
      nextFollowupDate
    } = req.body;

    // Validation
    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Activity type is required"
      });
    }

    const allowedTypes = ["Call", "Email", "Meeting", "Demo", "FollowUp"];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity type"
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required"
      });
    }

    if (!regarding || regarding.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Regarding field is required"
      });
    }

    if (!details || details.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Activity details are required"
      });
    }

    if (!contactId) {
      return res.status(400).json({
        success: false,
        message: "Contact is required"
      });
    }

    // Create activity
    const activity = new Activity({
    type,
    regarding,
      activityDetails,
      contactNumber,
      nextFollowupDate
      createdBy: req.user.id
>>>>>>> 622bbd3307f295a1a22a467f102f62acfd940c6e
    });

    await activity.save();

    res.status(201).json({
      success: true,
      message: "Activity created successfully",
      data: activity
    });

  } catch (error) {

      message: error.message
    
  }
});

router.get("/all", authMiddleware, async (req, res) => {
  try {

    const activities = await Activity.find()
      .populate("contactId", "name mobile email")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
router.get("/:id", authMiddleware, async (req, res) => {
  try {

    const activity = await Activity.findById(req.params.id)
      .populate("contactId", "name mobile email");

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    res.status(200).json({
      success: true,
      data: activity
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
router.put("/update/:id", authMiddleware, async (req, res) => {
  try {

    const { type, date, regarding, details, contactId, nextFollowupDate } = req.body;

    const allowedTypes = ["Call", "Email", "Meeting", "Demo", "FollowUp"];

    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity type"
      });
    }

    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found"
      });
    }

    activity.type = type || activity.type;
    activity.date = date || activity.date;
    activity.regarding = regarding || activity.regarding;
    activity.details = details || activity.details;
    activity.contactId = contactId || activity.contactId;
    activity.nextFollowupDate = nextFollowupDate || activity.nextFollowupDate;

    await activity.save();

    res.status(200).json({
      success: true,
      message: "Activity updated successfully",
      data: activity
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;