const Notification = require("../models/Notification");
const express = require("express");
const router = express.Router();
const { authMiddleware, adminOnly } = require("../middleware/auth");
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



module.exports = sendNotification;