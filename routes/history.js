const express = require("express");
const router = express.Router();

const History = require("../models/History");
const { authMiddleware } = require("../middleware/auth");

// Get All History
router.get("/", authMiddleware, async (req, res) => {
  try {

    const {
      userId,
      module,
      action,
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    if (userId) filter.userId = userId;

    if (module) filter.module = module;

    if (action) filter.action = action;

    if (startDate || endDate) {

      filter.createdAt = {};

      if (startDate)
        filter.createdAt.$gte = new Date(startDate);

      if (endDate)
        filter.createdAt.$lte = new Date(endDate);

    }

    const history = await History.find(filter)
      .populate("userId", "username email")
      .sort({ createdAt: -1 });

    res.json(history);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server Error",
    });

  }
});



// Get User History
router.get("/user/:userId", authMiddleware, async (req, res) => {

  try {

    const history = await History.find({
      userId: req.params.userId,
    }).sort({
      createdAt: -1,
    });

    res.json(history);

  } catch (err) {

    res.status(500).json({
      message: "Server Error",
    });

  }

});




// Get Module History

router.get("/module/:module", authMiddleware, async (req, res) => {

  try {

    const history = await History.find({
      module: req.params.module,
    }).sort({
      createdAt: -1,
    });

    res.json(history);

  } catch (err) {

    res.status(500).json({
      message: "Server Error",
    });

  }

});




// Get Record History

router.get("/record/:recordId", authMiddleware, async (req, res) => {

  try {

    const history = await History.find({
      recordId: req.params.recordId,
    }).sort({
      createdAt: -1,
    });

    res.json(history);

  } catch (err) {

    res.status(500).json({
      message: "Server Error",
    });

  }

});




// Delete History

router.delete("/:id", authMiddleware, async (req, res) => {

  try {

    await History.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "History Deleted",
    });

  } catch (err) {

    res.status(500).json({
      message: "Server Error",
    });

  }

});

module.exports = router;