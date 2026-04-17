// routes/businessLineRoutes.js
const express = require("express");
const router = express.Router();
const BusinessLine = require("../models/BusinessLine");

router.post("/create", async (req, res) => {
  try {
    let { businessLine, priceLevels } = req.body;

    // ✅ Normalize input
    businessLine = businessLine?.trim();

    if (!businessLine) {
      return res.status(400).json({ message: "Business Line required ❌" });
    }

    if (!Array.isArray(priceLevels) || priceLevels.length === 0) {
      return res.status(400).json({ message: "Price Levels required ❌" });
    }

    // ✅ Validate & sanitize priceLevels
    const levelSet = new Set();

    for (const level of priceLevels) {
      const levelName = level?.levelName?.trim();

      if (!levelName) {
        return res.status(400).json({ message: "Price level name required ❌" });
      }

      const levelKey = levelName.toLowerCase();

      if (levelSet.has(levelKey)) {
        return res.status(400).json({
          message: `Duplicate price level "${levelName}" ❌`
        });
      }
      levelSet.add(levelKey);

      // ✅ Validate products
      if (!Array.isArray(level.products) || level.products.length === 0) {
        return res.status(400).json({
          message: `Products required for "${levelName}" ❌`
        });
      }

      const productSet = new Set();

      for (const p of level.products) {
        const productName = p?.name?.trim();

        if (!productName) {
          return res.status(400).json({
            message: `Product name required in "${levelName}" ❌`
          });
        }

        const productKey = productName.toLowerCase();

        if (productSet.has(productKey)) {
          return res.status(400).json({
            message: `Duplicate product "${productName}" in ${levelName} ❌`
          });
        }

        productSet.add(productKey);

        // ✅ sanitize name back
        p.name = productName;
      }

      // ✅ sanitize level name
      level.levelName = levelName;
    }

    // ✅ Find existing (clean match)
    const existing = await BusinessLine.findOne({
      businessLine: { $regex: `^${businessLine}$`, $options: "i" }
    });

    if (existing) {
      for (const newLevel of priceLevels) {
        const levelMatch = existing.priceLevels.find(
          (lvl) =>
            lvl.levelName.trim().toLowerCase() ===
            newLevel.levelName.toLowerCase()
        );

        if (levelMatch) {
          for (const newProduct of newLevel.products) {
            const productMatch = levelMatch.products.find(
              (p) =>
                p.name.trim().toLowerCase() ===
                newProduct.name.toLowerCase()
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

    // ✅ Create new
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
    console.error(err);
    res.status(500).json({ message: "Server Error ❌" });
  }
});

router.get("/price-levels", async (req, res) => {
  try {
    const { search = "" } = req.query;

    const businessLines = await BusinessLine.find();
    console.log(businessLines)
    // 🔥 extract all level names
    const allLevels = businessLines.flatMap((bl) =>
      bl.priceLevels.map((pl) => pl.levelName)
    );

    // 🔥 remove duplicates
    const uniqueLevels = [...new Set(allLevels)];

    // 🔍 filter by search
    const filtered = uniqueLevels.filter((level) =>
      level.toLowerCase().includes(search.toLowerCase())
    );

    res.json(filtered.slice(0, 10)); // limit 10
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { search } = req.query;

    const result = await BusinessLine.find({
      businessLine: { $regex: search, $options: "i" },
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
router.get("/active", async (req, res) => {
  try {
    const data = await BusinessLine
      .find({ status: "active" })   // ✅ filter by status
      .sort({ createdAt: -1 });

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