
const express = require("express");
const router = express.Router();
const logActivity = require("../utils/Activitylog");
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
      const { message, senderType } =
        req.body;
 const senderId =
        req.user?._id || req.customer?._id;
      const newMessage =
        await TicketMessage.create({
          ticketId: req.params.ticketId,
          senderId,
          senderType,
          message,
        });
        const ticket = await Ticket.findById(req.params.ticketId);
        
     
      console.log("assigndata",ticket);
      

if (ticketData?.assignedTo) {
  await sendNotification({
    userId: ticketData.assignedTo,
    title: "New Customer Message",
    message: `Customer sent a new message on Ticket ${ticketData.ticketNumber}.`,
    type: "ticket",
    link: `/tickets/${ticketData._id}`,
  });
}

await logActivity({
  req,
  userId: senderId,
  module: "CUSTOMER_TICKET",
  action: "REPLY",
  description: `${senderType} replied to ticket ${
    ticket?.ticketNumber || req.params.ticketId
  }`,
  recordId: ticket?._id || req.params.ticketId,
  recordName: ticket?.ticketNumber || req.params.ticketId,
});
      res.status(201).json({
        success: true,
        message: newMessage,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);
module.exports = router;