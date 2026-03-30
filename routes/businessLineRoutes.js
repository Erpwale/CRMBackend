// routes/businessLineRoutes.js
const express = require("express");
const router = express.Router();
const BusinessLine = require("../models/BusinessLine");

// CREATE
router.post("/create", async (req, res) => {
  try {
    const { businessLine, priceLevels } = req.body;

    // 🔒 Prevent duplicate Business Line
    const existing = await BusinessLine.findOne({
      businessLine: { $regex: `^${businessLine}$`, $options: "i" }
    });
   if (existing) {
  for (const newLevel of priceLevels) {

    // 🔥 HERE you add level comparison
    const levelMatch = existing.priceLevels.find(
      (lvl) =>
        lvl.levelName.trim().toLowerCase() ===
        newLevel.levelName.trim().toLowerCase()
    );

    if (levelMatch) {
      for (const newProduct of newLevel.products) {

        const productMatch = levelMatch.products.find(
          (p) =>
            p.name.trim().toLowerCase() ===
            newProduct.name.trim().toLowerCase()
        );

        if (productMatch) {
          return res.status(400).json({
            message: `Duplicate: ${businessLine} → ${newLevel.levelName} → ${newProduct.name} ❌`
          });
        }
      }
    }
  }
}

    

    // 🚨 Validate priceLevels
    if (!priceLevels || priceLevels.length === 0) {
      return res.status(400).json({
        message: "At least one price level is required ❌"
      });
    }

    // 🔥 Validate each level & product
    for (const level of priceLevels) {
      if (!level.levelName) {
        return res.status(400).json({
          message: "Price Level name is required ❌"
        });
      }

      if (!level.products || level.products.length === 0) {
        return res.status(400).json({
          message: `Products required for ${level.levelName} ❌`
        });
      }

      for (const p of level.products) {
        if (!p.name) {
          return res.status(400).json({
            message: "Product name required ❌"
          });
        }

        if (p.gst > 99) {
          return res.status(400).json({
            message: "GST must be max 2 digits ❌"
          });
        }

        if (p.rate.toString().length > 7) {
          return res.status(400).json({
            message: "Rate max 7 digits ❌"
          });
        }

        if (p.discount?.toString().length > 5) {
          return res.status(400).json({
            message: "Discount max 5 digits ❌"
          });
        }
      }
    }

    const newData = new BusinessLine({
      businessLine,
      priceLevels
    });

    await newData.save();

    res.status(201).json({
      message: "Business Line created successfully ✅",
      data: newData,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET ALL
router.get("/", async (req, res) => {
  try {
    const data = await BusinessLine.find().sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET SINGLE
router.get("/:id", async (req, res) => {
  try {
    const data = await BusinessLine.findById(req.params.id);

    if (!data) return res.status(404).json({ message: "Not found" });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// UPDATE
router.put("/update/:id", async (req, res) => {
  try {
    const { businessLine, priceLevels } = req.body;

    const updated = await BusinessLine.findByIdAndUpdate(
      req.params.id,
      { businessLine, priceLevels },
      { new: true }
    );

    res.json({
      message: "Updated successfully",
      data: updated,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// DELETE
router.delete("/delete/:id", async (req, res) => {
  try {
    await BusinessLine.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;