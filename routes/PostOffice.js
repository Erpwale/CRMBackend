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
  let batch = [];
  const BATCH_SIZE = 1000;

  fs.createReadStream("data/pincode.csv")
    .pipe(csv())
    .on("data", async (data) => {
      batch.push({
        state: data.statename,
        district: data.district,
        city: data.officename,
        pincode: Number(data.pincode),
      });

      // Insert batch
      if (batch.length === BATCH_SIZE) {
        try {
          await Location.insertMany(batch, { ordered: false });
          batch = [];
        } catch (err) {
          console.log("Batch error:", err.message);
        }
      }
    })
    .on("end", async () => {
      try {
        if (batch.length > 0) {
          await Location.insertMany(batch, { ordered: false });
        }

        res.json({ message: "✅ Filtered 50k data imported successfully" });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
});

module.exports = router;