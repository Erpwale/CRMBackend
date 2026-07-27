const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const { authMiddleware } = require("../middleware/auth");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      {
        isRead: true,
      },
      {
        new: true,
      }
    );

    res.json(notification);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.put("/read-all", authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    res.json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.get("/sync", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.id,
      isDelivered: false,
    }).sort({ createdAt: 1 });

    await Notification.updateMany(
      {
        userId: req.user.id,
        isDelivered: false,
      },
      {
        $set: {
          isDelivered: true,
        },
      }
    );

    res.json({
      success: true,
      notifications,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
module.exports = router;