const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const Training = require("../models/Training");
const User = require("../models/User");
const logActivity = require("../utils/Activitylog");

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
      await logActivity({
  req,
  userId: req.user.id,
  module: "TRAINING",
  action: "CREATE",
  description: `Created training session "${training.sessionTitle}"`,
  recordId: training._id,
  recordName: training.sessionTitle,
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