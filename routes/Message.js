
const express = require("express");
const router = express.Router();

const { authMiddleware, adminOnly } = require("../middleware/auth");
const Ticket= require("../models/TicketSchema")
const TicketMessage= require("../models/ticketMessageSchema")

router.post(
  "/create",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        category,
        description,
      } = req.body;

      const ticket = await Ticket.create({
        category,
        description,
        customerId: req.user.id,
      });

      // CREATE FIRST MESSAGE
      await TicketMessage.create({
        ticketId: ticket._id,
        senderId: req.user.id,
        senderType: "customer",
        message: description,
      });

      res.status(201).json({
        success: true,
        ticket,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);
router.post(
  "/reply/:ticketId",
  authMiddleware,
  async (req, res) => {
    try {
      const { message } = req.body;

      const senderType =
        req.user.role === "admin" ||
        req.user.role === "Support Executive"
          ? "Support Executive"
          : "customer";

      const newMessage =
        await TicketMessage.create({
          ticketId: req.params.ticketId,
          senderId: req.user.id,
          senderType,
          message,
        });

      await Ticket.findByIdAndUpdate(
        req.params.ticketId,
        {
          lastMessage: message,
          lastMessageAt: new Date(),
        }
      );

      res.status(201).json({
        success: true,
        message: newMessage,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

module.exports = router;