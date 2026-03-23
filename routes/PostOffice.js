const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const csv = require("csv-parser");
const PostOffice  = require("../models/PostOfficeModel.js"); // your model

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
        circlename: data.circlename,
        regionname: data.regionname,
        divisionname: data.divisionname,
        officename: data.officename,
        pincode: Number(data.pincode),
        officetype: data.officetype,
        delivery: data.delivery,
        district: data.district,
        statename: data.statename,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
      });

      // 🔥 Insert when batch full
      if (batch.length === BATCH_SIZE) {
        try {
          await PostOffice.insertMany(batch, { ordered: false });
          batch = [];
        } catch (err) {
          console.log("Batch error:", err.message);
        }
      }
    })
    .on("end", async () => {
      try {
        // insert remaining data
        if (batch.length > 0) {
          await PostOffice.insertMany(batch, { ordered: false });
        }

        res.json({ message: "✅ 50k data imported successfully" });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
});

// Get all states
router.get("/states", async (req, res) => {
  const data = await PostOffice.distinct("statename"); // ✅ FIX
  res.json(data);
});

// Get districts
router.get("/districts/:state", async (req, res) => {
  const data = await PostOffice.distinct("district", {
    statename: req.params.state, // ✅ FIX
  });
  res.json(data);
});

// Get cities
router.get("/cities/:district", async (req, res) => {
  const data = await PostOffice.distinct("officename", { // ✅ FIX
    district: req.params.district,
  });
  res.json(data);
});

// Get pincode
router.get("/pincode/:city", async (req, res) => {
  const data = await PostOffice.find({
    officename: req.params.city, // ✅ FIX
  });
  res.json(data);
});


module.exports = router;