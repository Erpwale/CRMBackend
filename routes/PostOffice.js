const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const csv = require("csv-parser");
const Location = require("../models/PostOfficeModel.js"); // your model

// File upload setup
const upload = multer({ dest: "uploads/" });


// ✅ CSV Upload API
router.get("/import-csv", async (req, res) => {
  const results = [];

  fs.createReadStream("data/pincode.csv") // 👈 direct path
    .pipe(csv())
    .on("data", (data) => {
      results.push({
        state: data.statename,
        district: data.district,
        city: data.officename,
        pincode: Number(data.pincode),
      });
    })
    .on("end", async () => {
      try {
        await Location.insertMany(results);
        res.json({ message: "✅ CSV imported successfully" });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
});

module.exports = router;