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
    const { companyName, salesOrders, paymentMode, utrNumber,remainingAmount } = req.body;

    let totalReceived = 0;
    let totalTDS = 0;
    let advanceAmount = 0;

    const updatedOrders = [];

    // ✅ GET COMPANY FROM LEDGER
    const company = await Company.findOne({ companyName: companyName });

    if (!company) {
      return res.status(400).json({ message: "Company not found in ledger" });
    }

    const hasTAN = !!company.tan;

    // 🔹 LOOP ORDERS
    for (const item of salesOrders) {
      const order = await SalesOrder.findById(item.orderId);
      if (!order) continue;

      const received = Number(item.receivedAmount || 0);

      // ✅ Pending before payment
      const pendingBefore = order.pendingAmount || 0;

      // 🚫 VALIDATION: received cannot exceed pending
      if (received > pendingBefore) {
        return res.status(400).json({
          message: `Received amount cannot exceed pending for order ${order.orderNo}`,
        });
      }

      // ✅ TDS LOGIC FROM LEDGER
      let tdsPercent = 0;
      let tdsAmount = 0;

      if (hasTAN) {
      tdsPercent = Number(item.tdsPercent || 0);

if (tdsPercent < 0 || tdsPercent > 100) {
  return res.status(400).json({
    message: "Invalid TDS Percentage",
  });
}
        tdsPercent = Number(item.tdsPercent || 0);

        // ✅ APPLY ON PENDING (IMPORTANT FIX)
        tdsAmount = (pendingBefore * tdsPercent) / 100;
      }

      // 🔥 Ensure payments array exists
      order.payments = order.payments || [];

      // 🔥 ADD PAYMENT
      order.payments.push({
        amount: received,
        tdsPercent,
        tdsAmount,
        paymentMode,
        utrNumber,
      });

      // 🔥 TOTAL RECEIVED (including TDS)
      const totalReceivedSoFar = order.payments.reduce((sum, p) => {
        return sum + (p.amount || 0) + (p.tdsAmount || 0);
      }, 0);

      const billAmount = order.grossTotal || 0;

      let pendingAfter = billAmount - totalReceivedSoFar;

      // 🔥 ADVANCE HANDLING
      if (pendingAfter < 0) {
        advanceAmount += Math.abs(pendingAfter);
        pendingAfter = 0;
      }

      // 🔥 UPDATE ORDER
      order.receivedAmount = totalReceivedSoFar;
      order.pendingAmount = pendingAfter;
      order.isBill = totalReceivedSoFar > 0;
      order.isOutstanding = pendingAfter > 0;

      await order.save();

      // 🔥 UPDATE LEDGER BALANCE
      company.totalReceived = (company.totalReceived || 0) + received;
      company.totalTDS = (company.totalTDS || 0) + tdsAmount;
      company.balance = remainingAmount;

      await company.save();

      // 🔥 TOTALS
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
console.log(req.body.salesOrders);
    // 🔥 CREATE RECEIPT
    const receipt = await Receipt.create({
      receiptNo: await generateReceiptNo(),
      companyName,
      salesOrders: updatedOrders,
      totalReceived,
      totalTDS,
      advanceAmount,
      paymentMode,
      utrNumber,
    });

    return res.json({
      message: "✅ Receipt created successfully",
      data: receipt,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "❌ Server Error",
      error: err.message,
    });
  }
});

router.get("/all", async (req, res) => {
  try {
    const receipts = await Receipt.find()
      .populate({
        path: "salesOrders.orderId", // if ref exists
        model: "SalesOrder",
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: receipts,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching receipts",
      error: err.message,
    });
  }
});

module.exports = router;