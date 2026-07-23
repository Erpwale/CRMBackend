const express = require("express");
const router = express.Router();

const SalesOrder = require("../models/SalesOrder");
const CancelOrder = require("../models/CancelOrder");
const logActivity = require("../utils/Activitylog");
const { authMiddleware } = require("../middleware/auth");
router.post("/cancel-order", authMiddleware, async (req, res) => {
    try {
    const {
      salesOrderId,
      cancelReason,
      cancelledBy,
    } = req.body;

    const order = await SalesOrder.findById(salesOrderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Sales Order not found",
      });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order already cancelled",
      });
    }

    // Update Sales Order
    order.status = "Cancelled";
    order.cancelDate = new Date();
    order.cancelReason = cancelReason;
    order.cancelledBy = cancelledBy;

    await order.save();
await logActivity({
  req,
  userId: req.user.id,
  module: "CANCEL_ORDER",
  action: "CANCEL",
  description: `Cancelled Sales Order ${order.orderNo}`,
  recordId: order._id,
  recordName: order.orderNo,
});
    // Create Cancel Order Entry
 await CancelOrder.create({
  salesOrderId: order._id,

  orderNo: order.orderNo,
  companyName: order.companyName,
  businessLine: order.businessLine,

  orderAmount: order.grossTotal || 0,
  receivedAmount: order.receivedAmount || 0,
  pendingAmount: order.pendingAmount || 0,

  refundAmount: order.receivedAmount || 0,

  cancelReason,
  cancelledBy,
});
await logActivity({
  req,
  userId: req.user.id,
  module: "CANCEL_ORDER",
  action: "CREATE",
  description: `Created cancellation request for Order ${CancelOrder.orderNo}`,
  recordId: CancelOrder._id,
  recordName: CancelOrder.orderNo,
});
    return res.status(200).json({
      success: true,
      message: "Order Cancelled Successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/cancel-orders", async (req, res) => {
  try {
    const orders = await CancelOrder.find()
      .populate("salesOrderId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


router.put("/refund-processed/:id", authMiddleware, async (req, res) => {
     try {
      const order =
        await CancelOrder.findByIdAndUpdate(
          req.params.id,
          {
            refundStatus: "Processed",
          },
          {
            new: true,
          }
        );
await logActivity({
  req,
  userId: req.user.id,
  module: "CANCEL_ORDER",
  action: "REFUND_PROCESSED",
  description: `Refund processed for Order ${order.orderNo}`,
  recordId: order._id,
  recordName: order.orderNo,
});
      res.status(200).json({
        success: true,
        message: "Refund Updated",
        data: order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;