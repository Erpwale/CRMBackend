const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const PostOffice = require("../models/PostOfficeModel");

// File upload setup
const upload = multer({ dest: "uploads/" });

/**
 * ✅ Import CSV (upload OR local file)
 */
router.post("/import-csv", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file
      ? req.file.path
      : path.join(__dirname, "../data/pincode.csv");

    let batch = [];
    const BATCH_SIZE = 1000;

    const stream = fs.createReadStream(filePath).pipe(csv());

    stream.on("data", async (data) => {
      stream.pause(); // 🛑 prevent async issues

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

      if (batch.length >= BATCH_SIZE) {
        try {
          await PostOffice.insertMany(batch, { ordered: false });
          batch = [];
        } catch (err) {
          console.log("Batch error:", err.message);
        }
      }

      stream.resume(); // ▶ resume
    });

    stream.on("end", async () => {
      try {
        if (batch.length > 0) {
          await PostOffice.insertMany(batch, { ordered: false });
        }

        // 🧹 delete uploaded file (optional)
        if (req.file) fs.unlinkSync(req.file.path);

        res.json({ message: "✅ CSV imported successfully" });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    stream.on("error", (err) => {
      res.status(500).json({ error: err.message });
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Get all states
 */
router.get("/states", async (req, res) => {
  try {
    const data = await PostOffice.distinct("statename");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Get districts by state
 */
router.get("/districts/:state", async (req, res) => {
  try {
    const data = await PostOffice.distinct("district", {
      statename: { $regex: new RegExp(`^${req.params.state}$`, "i") },
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Get cities by district
 */
router.get("/cities/:district", async (req, res) => {
  try {
    const data = await PostOffice.distinct("officename", {
      district: { $regex: new RegExp(`^${req.params.district}$`, "i") },
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Get pincode by city
 */
router.get("/pincode/:city", async (req, res) => {
  try {
    const data = await PostOffice.find({
      officename: { $regex: new RegExp(`^${req.params.city}$`, "i") },
    }).limit(50); // 🚀 limit for performance

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;