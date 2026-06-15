const express = require("express");
const router = express.Router();

const SalesOrder = require("../models/SalesOrder");
const BillRequest = require("../models/BillRequest");

router.post("/send-bill-request", async (req, res) => {
  try {
    const { salesOrderId, userName } = req.body;

    const order = await SalesOrder.findById(salesOrderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
      });
    }

    const request = await BillRequest.create({
      salesOrderId: order._id,
      orderNo: order.orderNo,
      companyId: order.companyId,
      companyName: order.companyName,
      requestedBy: userName,
    });

    await SalesOrder.findByIdAndUpdate(order._id, {
      $inc: {
        billRequestCount: 1,
      },
      latestBillRequestStatus: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Bill request created",
      data: request,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


router.get("/", async (req, res) => {
  try {
    const requests = await BillRequest.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


router.get("/sales-order/:salesOrderId", async (req, res) => {
  try {
    const requests = await BillRequest.find({
      salesOrderId: req.params.salesOrderId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;