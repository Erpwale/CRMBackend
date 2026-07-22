const express = require("express");
const router = express.Router();

const SalesOrder = require("../models/SalesOrder");
const BillRequest = require("../models/BillRequest");
const logActivity = require("../utils/Activitylog");
const { authMiddleware } = require("../middleware/auth");
router.post("/send-bill-request", authMiddleware, async (req, res) => {  try {
    const { salesOrderId, userName } = req.body;

    const order = await SalesOrder.findById(salesOrderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
      });
    }

    // Prevent duplicate request
    const existingRequest = await BillRequest.findOne({
      salesOrderId,
      status: { $in: ["Pending", "Approved"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Bill request already exists for this order",
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
    await logActivity({
  req,
  userId: req.user.id,
  module: "BILL_REQUEST",
  action: "CREATE",
  description: `Bill request created for Order ${order.orderNo}`,
  recordId: request._id,
  recordName: order.orderNo,
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
    const requests = await BillRequest.find({
      status: "Pending",
    })
    .populate("salesOrderId")
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

router.put("/:id/update-sale-bill", authMiddleware, async (req, res) => {
    try {
    const { saleBillNo, saleBillDate } = req.body;

    // Validate required fields
    if (!saleBillNo || !saleBillDate) {
      return res.status(400).json({
        success: false,
        message: "Invoice number and invoice date are required",
      });
    }

    const request = await BillRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Bill Request not found",
      });
    }

    // Check duplicate invoice number (ignore current request)
    const existingInvoice = await BillRequest.findOne({
      invoiceNo: saleBillNo,
      _id: { $ne: req.params.id },
    });

    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: "Invoice number already exists",
      });
    }

    // Update BillRequest
    request.invoiceNo = saleBillNo;
    request.invoiceDate = saleBillDate;
    request.status = "Approved";
    request.approvedDate = new Date();

    await request.save();

    // Update SalesOrder
    const salesOrder = await SalesOrder.findByIdAndUpdate(
      request.salesOrderId,
      {
        invoiceNo: saleBillNo,
        invoiceDate: saleBillDate,
        isBill: true,
      },
      { new: true }
    );
await logActivity({
  req,
  userId: req.user.id,
  module: "BILL_REQUEST",
  action: "APPROVE",
  description: `Approved bill request for Order ${request.orderNo}`,
  recordId: request._id,
  recordName: request.orderNo,
});
    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: salesOrder,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Invoice number already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;