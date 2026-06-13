const express = require("express");
const router = express.Router();
const User = require("../models/User");
const WorkBench = require("../models/WorkBench");


const getTodayRecord = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (!["admin", "support", "sales"].includes(user.role)) {
    throw new Error("User role not allowed");
  }

  const date = new Date().toLocaleDateString("en-US");

  let record = await WorkBench.findOne({
    userId,
    date,
  });

  if (!record) {
    record = await WorkBench.create({
      userId,
      date,
      currentStatus: "bench",
      statusStartedAt: new Date(),
      totalWorkSeconds: 0,
      totalBenchSeconds: 0,
    });
  }

  return record;
};




router.post("/start-work/:id", async (req, res) => {
  try {
    const record = await getTodayRecord(req.params.id);

    const now = new Date();

    if (record.currentStatus === "bench") {
      record.totalBenchSeconds += Math.floor(
        (now - record.statusStartedAt) / 1000
      );
    }

    record.currentStatus = "work";
    record.statusStartedAt = now;

    await record.save();

    res.json({
      success: true,
      status: record.currentStatus,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});


router.post("/start-bench/:id", async (req, res) => {
  try {
    const record = await getTodayRecord(req.params.id);

    const now = new Date();

    if (record.currentStatus === "work") {
      record.totalWorkSeconds += Math.floor(
        (now - record.statusStartedAt) / 1000
      );
    }

    record.currentStatus = "bench";
    record.statusStartedAt = now;

    await record.save();

    res.json({
      success: true,
      status: record.currentStatus,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});



router.get("/timer/:id", async (req, res) => {
  try {
    const record = await getTodayRecord(req.params.id);

    const now = new Date();

    const currentSeconds = Math.floor(
      (now - record.statusStartedAt) / 1000
    );

    let workSeconds = record.totalWorkSeconds;
    let benchSeconds = record.totalBenchSeconds;

    if (record.currentStatus === "work") {
      workSeconds += currentSeconds;
    } else {
      benchSeconds += currentSeconds;
    }

    res.json({
      status: record.currentStatus,
      workSeconds,
      benchSeconds,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;