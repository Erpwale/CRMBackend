const Notification = require("../models/Notification");
const express = require("express");
const router = express.Router();
const sendNotification = async ({
  userId,
  title,
  message,
  type = "system",
  link = "",
}) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      link,
    });

    // Send only if user is online
    if (
      global.io &&
      global.onlineUsers &&
      global.onlineUsers.has(userId.toString())
    ) {
      global.io
        .to(userId.toString())
        .emit("newNotification", notification);

      // Mark as delivered
      notification.isDelivered = true;
      await notification.save();
    }

    return notification;
  } catch (err) {
    console.log(err);
  }
};

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

module.exports = sendNotification;