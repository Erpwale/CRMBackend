// routes/voucherConfig.js
const express = require("express");
const router = express.Router();
const VoucherConfig = require("../models/SalesVoucherConfig");

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
module.exports = router;