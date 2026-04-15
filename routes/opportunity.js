// routes/deal.js
const express = require("express");
const router = express.Router();
const Deal = require("../models/Deal");

// ➕ CREATE DEAL
router.post("/add", async (req, res) => {
  try {
    const deal = new Deal(req.body);
    await deal.save();

    res.status(201).json({
      message: "Opportunity created successfully",
      data: deal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating deal" });
  }
});

// ✏️ UPDATE DEAL
router.put("/:id", async (req, res) => {
  try {
    const updated = await Deal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      message: "Opportunity updated",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

// 📄 GET ALL
router.get("/", async (req, res) => {
  try {
    const deals = await Deal.find().sort({ createdAt: -1 });
    res.json(deals);
  } catch (err) {
    res.status(500).json({ message: "Fetch error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    res.json(deal);
  } catch (err) {
    res.status(500).json({ message: "Error fetching deal" });
  }
});