const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const Training = require("../models/Training");
const User = require("../models/User");


// IMAGE STORAGE
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    cb(
      null,
      Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
});


// CREATE TRAINING
router.post(
  "/create",
  authMiddleware,
  upload.single("trainerImage"),
  async (req, res) => {
    try {
      const {
        sessionTitle,
        trainer,
        duration,
        startDateTime,
        maxParticipants,
        meetingLink,
        agenda,
      } = req.body;

      if (!sessionTitle || !trainer || !duration || !startDateTime) {
        return res.status(400).json({
          message: "Please fill all required fields.",
        });
      }

      const trainerUser = await User.findOne({
        _id: trainer,
        role: "Support Executive",
      });

      if (!trainerUser) {
        return res.status(404).json({
          message: "Trainer not found.",
        });
      }

      const training = await Training.create({
        sessionTitle,
        trainer,
        trainerImage: req.file ? req.file.filename : "",
        duration,
        startDateTime,
        maxParticipants,
        meetingLink,
        agenda,
        createdBy: req.user.id,
      });

      res.status(201).json({
        success: true,
        message: "Training scheduled successfully.",
        training,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);
// user regisretaion for training

router.post("/register", async (req, res) => {
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
    const registrations = await TrainingRegistration.find({
      trainingId,
    });

    const currentParticipants = registrations.reduce(
      (total, reg) => total + Number(reg.participantCount || 1),
      0
    );

    const requestedParticipants = Number(participantCount);

    // Check max participants
    if (
      currentParticipants + requestedParticipants >
      training.maxParticipants
    ) {
      return res.status(400).json({
        success: false,
        message: `Only ${
          training.maxParticipants - currentParticipants
        } seat(s) are available.`,
      });
    }

    // Save registration
    const registration = await TrainingRegistration.create({
      trainingId,
      fullName,
      email,
      companyName,
      serialNumber,
      participantCount,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: registration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Latest training
router.get("/latest", async (req, res) => {
  try {
    const training = await Training.findOne({
      startDateTime: { $gte: new Date() },
    })
      .populate("trainer", "name")
      .sort({ startDateTime: 1 }); // nearest upcoming training

    if (!training) {
      return res.status(404).json({
        success: false,
        message: "No upcoming training found",
      });
    }

    res.json({
      success: true,
      data: training,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// GET ALL TRAININGS
router.get("/", async (req, res) => {
  try {
    const trainings = await Training.find().sort({
      createdAt: -1,
    });

    res.status(200).json(trainings);
  } catch (error) {
    res.status(500).json({
      message: "Error Fetching Trainings",
    });
  }
});

module.exports = router;