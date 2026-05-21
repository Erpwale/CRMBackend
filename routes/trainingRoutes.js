const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const Training = require("../models/Training");


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
  upload.single("image"),
  async (req, res) => {
    try {
      const newTraining = new Training({
        title: req.body.title,
        short: req.body.short,
        description: req.body.description,
        date: req.body.date,
        image: req.file.path,
      });

      await newTraining.save();

      res.status(201).json({
        success: true,
        message: "Training Created Successfully",
        data: newTraining,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message: "Server Error",
      });
    }
  }
);


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