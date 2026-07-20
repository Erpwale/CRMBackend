const express = require("express");
const router = express.Router();

const SalesOrder = require("../models/SalesOrder");
const BillRequest = require("../models/BillRequest");

router.post("/send-bill-request", async (req, res) => {
  try {
    const {
      salesOrderId,
      userName,
      invoiceNo,
      invoiceDate,
    } = req.body;

    const order = await SalesOrder.findById(salesOrderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
      });
    }

    // Prevent duplicate bill request
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

    // Prevent duplicate invoice number
    if (invoiceNo) {
      const existingInvoice = await BillRequest.findOne({
        invoiceNo,
      });

      if (existingInvoice) {
        return res.status(400).json({
          success: false,
          message: "Invoice number already exists",
        });
      }
    }

    const request = await BillRequest.create({
      salesOrderId: order._id,
      orderNo: order.orderNo,
      companyId: order.companyId,
      companyName: order.companyName,
      requestedBy: userName,
      invoiceNo,
      invoiceDate,
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
    // Handle duplicate key error from MongoDB
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Invoice number already exists",
      });
    }

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

router.put("/:id/update-sale-bill", async (req, res) => {
  try {
    const { saleBillNo, saleBillDate } = req.body;

    const request = await BillRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Bill Request not found",
      });
    }

    const salesOrder = await SalesOrder.findByIdAndUpdate(
      request.salesOrderId,
      {
        invoiceNo: saleBillNo,
        invoiceDate: saleBillDate,
        isBill: true,
      },
      { new: true }
    );
      // Update Bill Request Status
    request.status = "Approved";
    await request.save();

    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: salesOrder,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;