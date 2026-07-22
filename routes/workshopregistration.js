// User Registration for Training
const WorkshopRegistration = require("../models/WorkshopRegistration");
const Training = require("../models/Training");
const express = require("express");
const router = express.Router();
const logActivity = require("../utils/Activitylog");
const { authMiddleware } = require("../middleware/auth");

router.post("/register", authMiddleware, async (req, res) => {
    try {
    const {
      trainingId,
      fullName,
      email,
      companyName,
      serialNumber,
      participantCount,
    } = req.body;

    // Find training
    const training = await Training.findById(trainingId);

    if (!training) {
      return res.status(404).json({
        success: false,
        message: "Training not found",
      });
    }

    // Count already registered participants
    const registrations = await WorkshopRegistration.find({ trainingId });

    const currentParticipants = registrations.reduce(
      (total, reg) => total + Number(reg.participantCount || 1),
      0
    );

    const requestedParticipants = Number(participantCount || 1);

    // Check available seats
    if (currentParticipants + requestedParticipants > training.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: `Registration is full. Only ${
          training.maxParticipants - currentParticipants
        } seat(s) left.`,
      });
    }

    // Optional: Prevent duplicate registration by email
    const existingRegistration = await WorkshopRegistration.findOne({
      trainingId,
      email,
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "You have already registered for this training.",
      });
    }

    // Save registration
    const registration = await WorkshopRegistration.create({
      trainingId,
      fullName,
      email,
      companyName,
      serialNumber,
      participantCount: requestedParticipants,
    });
    await logActivity({
  req,
  userId: req.user.id,
  module: "TRAINING_REGISTRATION",
  action: "CREATE",
  description: `Registered ${fullName} for training "${training.sessionTitle}"`,
  recordId: registration._id,
  recordName: training.sessionTitle,
});

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: registration,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});


router.post("/logout/:id", async (req, res) => {
  try {
    const record = await getTodayRecord(req.params.id);

    const now = new Date();

    if (
      record.currentStatus === "work" &&
      record.workStartTime
    ) {
      const duration = Math.floor(
        (now - record.workStartTime) / 1000
      );

      record.totalWorkSeconds += duration;

      record.history.push({
        status: "work",
        startTime: record.workStartTime,
        endTime: now,
        durationSeconds: duration,
      });

      record.workStartTime = null;
    }

    if (
      record.currentStatus === "bench" &&
      record.benchStartTime
    ) {
      const duration = Math.floor(
        (now - record.benchStartTime) / 1000
      );

      record.totalBenchSeconds += duration;

      record.history.push({
        status: "bench",
        reason: record.benchReason,
        remark: record.benchRemark,
        startTime: record.benchStartTime,
        endTime: now,
        durationSeconds: duration,
      });

      record.benchStartTime = null;
    }

    record.logoutTime = now;

    await record.save();

    res.json({
      success: true,
      message: "Logout recorded",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
module.exports = router;