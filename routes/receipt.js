const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const SalesOrder = require("../models/SalesOrder.js")
const Receipt = require("../models/Receipt");   // 🔥 MISSING
const Company = require("../models/Ledger");   // 🔥 MISSING

const generateReceiptNo = async () => {
  const last = await Receipt.findOne().sort({ createdAt: -1 });

  let next = 1;

  if (last && last.receiptNo) {
    const num = parseInt(last.receiptNo.split("-")[1]);
    next = num + 1;
  }

  return `RCPT-${String(next).padStart(4, "0")}`;
};
router.get("/next-receipt-no", async (req, res) => {
  try {
    const last = await Receipt.findOne().sort({ createdAt: -1 });

    let next = 1;

    if (last && last.receiptNo) {
      const num = parseInt(last.receiptNo.split("-")[1]);
      next = num + 1;
    }

    const receiptNo = `RCPT-${String(next).padStart(4, "0")}`;

    res.json({ receiptNo });
  } catch (err) {
    res.status(500).json({ message: "Error generating receipt no" });
  }
});

router.post("/create", async (req, res) => {
  try {
    const { companyId, salesOrders, paymentMode, utrNumber } = req.body;

    let totalReceived = 0;
    let totalTDS = 0;
    let advanceAmount = 0;

    const updatedOrders = [];

    // 🔹 LOOP ORDERS
    for (const item of salesOrders) {
      const order = await SalesOrder.findById(item.orderId);

      if (!order) continue;

      let received = Number(item.receivedAmount || 0);

      // ✅ TAN FROM ORDER
      const hasTAN = !!order.tanNumber;

      let tdsPercent = hasTAN ? Number(item.tdsPercent || 0) : 0;
      let tdsAmount = (received * tdsPercent) / 100;

      // ❌ If no TAN → force 0
      if (!hasTAN) {
        tdsPercent = 0;
        tdsAmount = 0;
      }

      const totalPaid = received + tdsAmount;

      const pendingBefore = order.pendingAmount;
      let pendingAfter = pendingBefore - totalPaid;

      // 🔥 EXTRA → ADVANCE
      if (pendingAfter < 0) {
        advanceAmount += Math.abs(pendingAfter);
        pendingAfter = 0;
      }

      // 🔥 UPDATE ORDER
      order.pendingAmount = pendingAfter;
      order.isOutstanding = pendingAfter > 0;
      order.isBill = true;

      await order.save();

      totalReceived += received;
      totalTDS += tdsAmount;

      updatedOrders.push({
        orderId: order._id,
        orderNo: order.orderNo,
        orderAmount: order.subtotal,
        billAmount: order.grossTotal,
        receivedAmount: received,
        tdsPercent,
        tdsAmount,
        pendingBefore,
        pendingAfter,
      });
    }

    // 🔥 CREATE RECEIPT
    const receipt = await Receipt.create({
      receiptNo: await generateReceiptNo(),
      companyId,
      salesOrders: updatedOrders,
      totalReceived,
      totalTDS,
      advanceAmount,
      paymentMode,
      utrNumber,
    });

    return res.json({
      message: "Receipt created successfully",
      data: receipt,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;