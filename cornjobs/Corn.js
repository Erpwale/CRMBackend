const cron = require("node-cron");
const Activity = require("../models/activityModel");
const sendNotification = require("../utils/sendNotification");

cron.schedule("0 * * * *", async () => {
  try {
    // Today's date in YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];

    const activities = await Activity.find({
      nextFollowupDate: today,
      notificationSent: false,
    });

    for (const activity of activities) {
      await sendNotification({
        userId: activity.createdBy,
        title: "Follow-up Reminder",
        message: `You have a follow-up regarding ${activity.regarding}.`,
        type: "system",
        link: `/activities/${activity._id}`,
      });

      activity.notificationSent = true;
      await activity.save();
    }
  } catch (err) {
    console.error(err);
  }
});