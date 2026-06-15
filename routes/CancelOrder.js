const express = require("express");
const router = express.Router();

const SalesOrder = require("../models/SalesOrder");
const CancelOrder = require("../models/CancelOrder");

router.post("/cancel-order", async (req, res) => {
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


router.put(
  "/refund-processed/:id",
  async (req, res) => {
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