const Notification = require("../models/Notification");

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

    if (global.io) {
      global.io.to(userId.toString()).emit(
        "newNotification",
        notification
      );
    }

    return notification;
  } catch (err) {
    console.log(err);
  }
};

module.exports = sendNotification;