const express = require("express");
const router = express.Router();

const TicketFeedback = require("../models/TicketFeedback");
const Ticket = require("../models/TicketSchema");

// Submit Feedback
router.post("/submit", async (req, res) => {
  try {
    const { ticketId, rating, feedback } = req.body;

    if (!ticketId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Ticket and Rating are required.",
      });
    }

    // Check ticket exists
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    // Prevent duplicate feedback
    const exists = await TicketFeedback.findOne({ ticketId });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Feedback already submitted.",
      });
    }

    const newFeedback = new TicketFeedback({
      ticketId,
      rating,
      feedback,
      customerName: ticket.customerName,
      supportExecutive: ticket.assignedTo,
    });

    await newFeedback.save();

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully.",
      data: newFeedback,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Get Feedback By Ticket
router.get("/:ticketId", async (req, res) => {
  try {
    const feedback = await TicketFeedback.findOne({
      ticketId: req.params.ticketId,
    });

    res.json({
      success: true,
      data: feedback,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;