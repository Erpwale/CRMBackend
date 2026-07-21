const express = require("express");
const router = express.Router();
const User = require("../models/User");
const WorkBench = require("../models/workTrackerSchema");
const Ticket = require("../models/TicketSchema");


const getTodayRecord = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (!["admin", "Support Executive", "sales"].includes(user.role)) {
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
     currentStatus: "work",
workStartTime: new Date(),
benchStartTime: null,
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
     const duration = Math.floor(
  (now - record.benchStartTime) / 1000
);
      record.totalBenchSeconds += duration;

      // Save completed bench session
      record.history.push({
        status: "bench",
        reason: record.benchReason,
        remark: record.benchRemark,
        startTime: record.benchStartTime,
        endTime: now,
        durationSeconds: duration,
      });
    }

    record.currentStatus = "work";
    record.benchReason = "";
    record.benchRemark = "";
record.workStartTime = now;
record.benchStartTime = null;

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
  const { reason, remark } = req.body;

  const record = await getTodayRecord(req.params.id);

  const now = new Date();

  if (record.currentStatus === "work") {
const duration = Math.floor(
  (now - record.workStartTime) / 1000
);

    record.totalWorkSeconds += duration;

    record.history.push({
      status: "work",
      startTime: record.workStartTime,
      endTime: now,
      durationSeconds: duration,
    });
  }

  record.currentStatus = "bench";
  record.benchReason = reason;
  record.benchRemark = remark;
  record.benchStartTime = now;
record.workStartTime = null;

  await record.save();

  res.json(record);
});



router.get("/timer/:id", async (req, res) => {
  try {
    const record = await getTodayRecord(req.params.id);

    const now = new Date();
let workSeconds = record.totalWorkSeconds;
let benchSeconds = record.totalBenchSeconds;

if (
  record.currentStatus === "work" &&
  record.workStartTime
) {
  workSeconds += Math.floor(
    (now - record.workStartTime) / 1000
  );
}

if (
  record.currentStatus === "bench" &&
  record.benchStartTime
) {
  benchSeconds += Math.floor(
    (now - record.benchStartTime) / 1000
  );
}

   res.json({
  status: record.currentStatus,

  workStartTime: record.workStartTime,
  benchStartTime: record.benchStartTime,

  totalWorkSeconds: record.totalWorkSeconds,
  totalBenchSeconds: record.totalBenchSeconds,

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

router.post("/login/:id", async (req, res) => {
  try {
    const record = await getTodayRecord(req.params.id);

    const now = new Date();

    // If already working, do nothing
    if (record.currentStatus === "work" && record.workStartTime) {
      return res.json({
        success: true,
        message: "Work session already running",
        data: record,
      });
    }

    // If user was on bench, close bench session
    if (
      record.currentStatus === "bench" &&
      record.benchStartTime
    ) {
      const duration = Math.floor(
        (now - record.benchStartTime) / 1000
      );

      record.totalBenchSeconds += duration;

      record.history.push({
        status: "bench",
        reason: record.benchReason,
        remark: record.benchRemark,
        startTime: record.benchStartTime,
        endTime: now,
        durationSeconds: duration,
      });
    }

    // Start Work
    record.currentStatus = "work";
    record.workStartTime = now;
    record.benchStartTime = null;
    record.benchReason = "";
    record.benchRemark = "";

    await record.save();

    res.json({
      success: true,
      message: "Work started successfully",
      data: record,
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