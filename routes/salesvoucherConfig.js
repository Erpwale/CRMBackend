// routes/voucherConfig.js
const express = require("express");
const router = express.Router();
const VoucherConfig = require("../models/SalesVoucherConfig");

// SAVE OR UPDATE
router.post("/", async (req, res) => {
  try {
    const { restart } = req.body;

    if (!restart?.applicableFrom || !restart?.periodicity) {
      return res.status(400).json({
        message: "Applicable From and Periodicity required",
      });
    }

    const newDate = new Date(restart.applicableFrom);
    const newYear = newDate.getFullYear();
    const newMonth = newDate.getMonth();

    // 🔍 Fetch existing configs
    const existingConfigs = await VoucherConfig.find();

    // 🚫 Conflict check
    const conflict = existingConfigs.find((c) => {
      const existingDate = new Date(c.restart.applicableFrom);
      const year = existingDate.getFullYear();
      const month = existingDate.getMonth();

      // ❌ Yearly duplicate (same year)
      if (
        restart.periodicity === "Yearly" &&
        c.restart.periodicity === "Yearly"
      ) {
        return year === newYear;
      }

      // ❌ Monthly duplicate (same month + year)
      if (
        restart.periodicity === "Monthly" &&
        c.restart.periodicity === "Monthly"
      ) {
        return year === newYear && month === newMonth;
      }

      return false;
    });

    if (conflict) {
      return res.status(400).json({
        message: "Configuration already exists for this period",
      });
    }

    // ✅ Save new config
    const config = new VoucherConfig(req.body);
    await config.save();

    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/preview", async (req, res) => {
  const config = await VoucherConfig.findOne();

  let number = config.currentNumber;

  let formattedNumber = config.prefillZero
    ? String(number).padStart(config.width, "0")
    : String(number);

  const finalNumber = `${config.prefix?.value || ""}${formattedNumber}${config.suffix?.value || ""}`;

  res.json({ voucherNumber: finalNumber });
});

router.post("/generate", async (req, res) => {
  const config = await VoucherConfig.findOne();

  let number = config.currentNumber;

  let formattedNumber = config.prefillZero
    ? String(number).padStart(config.width, "0")
    : String(number);

  const finalNumber = `${config.prefix?.value || ""}${formattedNumber}${config.suffix?.value || ""}`;

  // ✅ increment ONLY here
  config.currentNumber += 1;
  await config.save();

  res.json({ voucherNumber: finalNumber });
});

// routes/voucherConfig.js

router.get("/", async (req, res) => {
  try {
    let config = await VoucherConfig.find();

    // ✅ FIX: check length instead
    if (config.length === 0) {
      return res.json({
        startingNumber: 1,
        width: 3,
        prefillZero: true,
        restart: {
          applicableFrom: "",
          startingNumber: 1,
          periodicity: "Yearly",
        },
        prefix: {
          applicableFrom: "",
          value: "",
        },
        suffix: {
          applicableFrom: "",
          value: "",
        },
      });
    }

    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;