// routes/businessLineRoutes.js
const express = require("express");
const router = express.Router();
const BusinessLine = require("../models/BusinessLine");

// CREATE
router.post("/create", async (req, res) => {
  try {
    const { businessLine, discountAllowed, products } = req.body;

    const newData = new BusinessLine({
      businessLine,
      discountAllowed,
      products,
      // createdBy: req.user.id  (if auth)
    });

    await newData.save();

    res.status(201).json({
      message: "Business Line created successfully",
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
    const { businessLine, discountAllowed, products } = req.body;

    const updated = await BusinessLine.findByIdAndUpdate(
      req.params.id,
      { businessLine, discountAllowed, products },
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