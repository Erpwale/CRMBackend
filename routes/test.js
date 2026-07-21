const express = require("express");
const router = express.Router();

const sendNotification = require("../utils/sendNotification");

router.post("/test", async (req, res) => {
  try {
    const { userId } = req.body;

    await sendNotification({
      userId,
      title: "Test Notification",
      message: "🎉 Notification is working successfully!",
      type: "system",
      link: "/dashboard",
    });

    res.json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;