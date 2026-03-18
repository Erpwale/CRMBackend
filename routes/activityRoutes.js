const express = require("express");
const router = express.Router();
const Activity = require("../models/activityModel");
const Contact = require("../models/Contact");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const { io } = require("../server");


router.post("/create", authMiddleware, async (req, res) => {
  try {

    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    const {
      type,
      regarding,
      activityDetails,
      contactNumber,
      nextFollowupDate
    } = req.body;

    if (!type || !regarding || !activityDetails || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    const contact = await Contact.findOne({ mobile: contactNumber });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    const activity = await Activity.create({
      type,
      regarding,
      details: activityDetails,
      contactId: contact._id,
      nextFollowupDate,
      companyId: contact.companyId, // ✅ already correct
      createdBy: req.user?.id
    });
    const populatedActivity = await Activity.findById(activity._id)
      .populate("contactId", "name")
      .populate("createdBy", "name");

    // 🔥🔥🔥 ADD THIS (MOST IMPORTANT)
  
    const companyId = contact.companyId.toString();

    if (global.io) {
      global.io.to(companyId).emit("activityAdded", populatedActivity);
      } else {
  console.log("❌ Socket not initialized");
      }

    // ✅ response
    res.status(201).json({
      success: true,
      data: activity
    });

  } catch (error) {
    console.error("Activity Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
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
// GET ACTIVITIES BY COMPANY
router.get("/company/:companyId", authMiddleware, async (req, res) => {
  try {
    const { companyId } = req.params;

    const activities = await Activity.find({ companyId })
     .populate("contactId", "name mobile email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: activities.length,
      activities
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching activities"
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

    // ✅ update fields
    activity.type = type || activity.type;
    activity.date = date || activity.date;
    activity.regarding = regarding || activity.regarding;
    activity.details = details || activity.details;
    activity.contactId = contactId || activity.contactId;
    activity.nextFollowupDate = nextFollowupDate || activity.nextFollowupDate;

    await activity.save();

    // 🔥🔥🔥 REAL-TIME EMIT
    const companyId = activity.companyId.toString();
    io.to(companyId).emit("activityUpdated", activity);

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