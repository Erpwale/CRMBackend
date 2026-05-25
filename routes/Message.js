
const express = require("express");
const router = express.Router();

const { authMiddleware, adminOnly } = require("../middleware/auth");
const Ticket= require("../models/TicketSchema")
const TicketMessage= require("../models/ticketMessageSchema")


router.post(
  "/reply/:ticketId",
  authMiddleware,
  async (req, res) => {
    try {
      const { message } = req.body;

      const senderType =
        req.user.role === "admin" ||
        req.user.role === "agent"
          ? "agent"
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