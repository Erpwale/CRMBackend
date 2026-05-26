const express = require("express");
const router = express.Router();

const WorkTracker = require(
  "../models/workTrackerSchema"
);

const { authMiddleware } = require(
  "../middleware/auth.js"
);

const getTodayDate = () => {
  return new Date()
    .toISOString()
    .split("T")[0]///////////////////////////////////////;
};

router.post(
  "/start",
  authMiddleware,
  async (req, res) => {
    try {
      const todayDate =
        getTodayDate();

      let tracker =
        await WorkTracker.findOne({
          supportId: req.user.id,
          date: todayDate,
        });

      if (!tracker) {
        tracker =
          await WorkTracker.create({
            supportId: req.user.id,

            date: todayDate,

            status: "Working",

            totalSeconds: 0,

            benchTotalSeconds: 0,

            benchReasons: [],

            loginTime: new Date(),
          });
      }

      res.json({
        success: true,
        tracker,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

router.put(
  "/update/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        totalSeconds,
        benchTotalSeconds,
        status,
        benchReason,
      } = req.body;

      const updateData = {
        totalSeconds,
        benchTotalSeconds,
        status,
      };

      if (benchReason) {
        updateData.$push = {
          benchReasons: benchReason,
        };
      }

      const tracker =
        await WorkTracker.findByIdAndUpdate(
          req.params.id,
          updateData,
          {
            new: true,
          }
        );

      res.json({
        success: true,
        tracker,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

router.post(
  "/end-shift/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const tracker =
        await WorkTracker.findByIdAndUpdate(
          req.params.id,
          {
            logoutTime: new Date(),
            status: "Completed",
          },
          {
            new: true,
          }
        );

      res.json({
        success: true,
        tracker,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

router.get(
  "/today",
  authMiddleware,
  async (req, res) => {
    try {
      const todayDate =
        getTodayDate();

      const tracker =
        await WorkTracker.findOne({
          supportId: req.user.id,
          date: todayDate,
        });

      res.json({
        success: true,
        tracker,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;