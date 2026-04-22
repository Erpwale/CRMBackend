// routes/voucherConfig.js
const express = require("express");
const router = express.Router();
const VoucherConfig = require("../models/VoucherConfig");

// SAVE OR UPDATE
router.post("/", async (req, res) => {
  try {
    let config = await VoucherConfig.findOne();

    if (config) {
      config = await VoucherConfig.findByIdAndUpdate(
        config._id,
        req.body,
        { new: true }
      );
    } else {
      config = new VoucherConfig(req.body);
      await config.save();
    }

    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const config = await VoucherConfig.findOne();
    if (!config) return res.status(400).json({ message: "Config not found" });

    let number = config.currentNumber;

    // ✅ restart logic (basic yearly example)
    if (config.restart?.periodicity === "Yearly") {
      const currentYear = new Date().getFullYear();
      const configYear = new Date(config.restart.applicableFrom).getFullYear();

      if (currentYear !== configYear) {
        number = config.restart.startingNumber || 1;
        config.currentNumber = number;
      }
    }

    // ✅ padding
    let formattedNumber = config.prefillZero
      ? String(number).padStart(config.width, "0")
      : String(number);

    const finalNumber = `${config.prefix?.value || ""}${formattedNumber}${config.suffix?.value || ""}`;

    // ✅ increment counter
    config.currentNumber += 1;
    await config.save();

    res.json({ voucherNumber: finalNumber });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;