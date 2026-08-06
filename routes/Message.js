
const express = require("express");
const router = express.Router();
const logActivity = require("../utils/Activitylog");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const Ticket= require("../models/TicketSchema")
const TicketMessage= require("../models/ticketMessageSchema")
const sendNotification= require("../utils/sendNotification")

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


await logActivity({
  req,
  userId: req.user.id,
  module: "CUSTOMER_TICKET",
  action: "CREATE",
  description: `Created customer ticket (${category})`,
  recordId: ticket._id,
  recordName: ticket.ticketNumber || ticket._id.toString(),
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
      const { message, senderType } = req.body;
      console.log("senderType",senderType);
      

      const senderId = req.user?._id || req.customer?._id;

      // Save message
      const newMessage = await TicketMessage.create({
        ticketId: req.params.ticketId,
        senderId,
        senderType,
        message,
      });

      // Populate sender details
      const populatedMessage = await TicketMessage.findById(newMessage._id)
        .populate("senderId", "name email");

      // Get ticket
      const ticket = await Ticket.findById(req.params.ticketId);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found",
        });
      }

      // ==========================
      // REALTIME CHAT
      // ==========================
      global.io
        .to(`ticket-${ticket._id}`)
        .emit("newMessage", populatedMessage);

      // ==========================
      // NOTIFICATION
      // ==========================
      if (ticket.assignedTo) {
        await sendNotification({
          userId: ticket.assignedTo,
          title: "New Customer Message",
          message: `Customer sent a new message on Ticket ${ticket.ticketNumber}.`,
          type: "ticket",
          link: `/tickets/${ticket._id}`,
        });
      }

      // ==========================
      // ACTIVITY LOG
      // ==========================
      await logActivity({
        req,
        userId: senderId,
        module: "CUSTOMER_TICKET",
        action: "REPLY",
        description: `${senderType} replied to ticket ${ticket.ticketNumber}`,
        recordId: ticket._id,
        recordName: ticket.ticketNumber,
      });

      // ==========================
      // RESPONSE
      // ==========================
      res.status(201).json({
        success: true,
        message: "Reply sent successfully.",
        data: populatedMessage,
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);
module.exports = router;