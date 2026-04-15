// routes/businessLineRoutes.js
const express = require("express");
const router = express.Router();
const BusinessLine = require("../models/BusinessLine");

router.post("/create", async (req, res) => {
  try {
    const { businessLine, priceLevels } = req.body;

    if (!businessLine) {
      return res.status(400).json({ message: "Business Line required ❌" });
    }

    if (!priceLevels || priceLevels.length === 0) {
      return res.status(400).json({ message: "Price Levels required ❌" });
    }

    // ✅ Prevent duplicate priceLevels in request
    const levelSet = new Set();
    for (const level of priceLevels) {
      const key = level.levelName.trim().toLowerCase();

      if (levelSet.has(key)) {
        return res.status(400).json({
          message: `Duplicate price level "${level.levelName}" ❌`
        });
      }
      levelSet.add(key);
    }

    // ✅ Prevent duplicate products in same level
    for (const level of priceLevels) {
      const productSet = new Set();

      for (const p of level.products) {
        const key = p.name.trim().toLowerCase();

        if (productSet.has(key)) {
          return res.status(400).json({
            message: `Duplicate product "${p.name}" in ${level.levelName} ❌`
          });
        }

        productSet.add(key);
      }
    }

    const existing = await BusinessLine.findOne({
      businessLine: { $regex: `^${businessLine}$`, $options: "i" }
    });

    if (existing) {
      for (const newLevel of priceLevels) {

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

            levelMatch.products.push(newProduct);
          }

        } else {
          existing.priceLevels.push(newLevel);
        }
      }

      await existing.save();

      return res.json({
        message: "Updated existing Business Line ✅",
        data: existing
      });
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

router.get("/price-levels", async (req, res) => {
  try {
    const { search } = req.query;

    const result = await PriceLevel.find({
      name: { $regex: search, $options: "i" }, // case-insensitive
    }).limit(10);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
router.patch("/status/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await BusinessLine.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({
      message: `Status updated to ${status}`,
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