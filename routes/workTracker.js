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
      const duration = Math.floor(
        (now - record.statusStartedAt) / 1000
      );

      record.totalBenchSeconds += duration;

      // Save completed bench session
      record.history.push({
        status: "bench",
        reason: record.benchReason,
        remark: record.benchRemark,
        startTime: record.statusStartedAt,
        endTime: now,
        durationSeconds: duration,
      });
    }

    record.currentStatus = "work";
    record.benchReason = "";
    record.benchRemark = "";
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
  const { reason, remark } = req.body;

  const record = await getTodayRecord(req.params.id);

  const now = new Date();

  if (record.currentStatus === "work") {
    const duration = Math.floor(
      (now - record.statusStartedAt) / 1000
    );

    record.totalWorkSeconds += duration;

    record.history.push({
      status: "work",
      startTime: record.statusStartedAt,
      endTime: now,
      durationSeconds: duration,
    });
  }

  record.currentStatus = "bench";
  record.benchReason = reason;
  record.benchRemark = remark;
  record.statusStartedAt = now;

  await record.save();

  res.json(record);
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


router.post("/ticket/start-work/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.workStartedAt = new Date();
    ticket.isWorking = true;

    await ticket.save();

    res.json({
      success: true,
      message: "Work started",
    });
  } catch (err) {
    console.log(err);
  }
});

router.post("/ticket/stop-work/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket?.workStartedAt) {
      return res.status(400).json({
        success: false,
        message: "Work not started",
      });
    }

    const workedSeconds = Math.floor(
      (new Date() - ticket.workStartedAt) / 1000
    );

    ticket.totalWorkSeconds += workedSeconds;
    ticket.workStartedAt = null;
    ticket.isWorking = false;

    await ticket.save();

    res.json({
      success: true,
      totalWorkSeconds: ticket.totalWorkSeconds,
    });
  } catch (err) {
    console.log(err);
  }
});
module.exports = router;