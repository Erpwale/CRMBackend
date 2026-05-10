const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const SalesOrder = require("../models/SalesOrder.js")
const opp = require("../models/Proposal"); // import model
const generatePDF = require("../utils/generateInvoice.js");
/* ✅ VALIDATION FUNCTION */
const fs = require("fs");
const path = require("path");
const Ledger = require("../models/Ledger.js");

const logoPath = path.join(__dirname, "../assets/erplogo.jpeg");
const erpstamp = path.join(__dirname, "../assets/erpstamp.png");
const logoBase64 = fs.readFileSync(logoPath, "base64");
const stampBase64 = fs.readFileSync(erpstamp, "base64");
const validate = (body) => {
  const {
    partyName,
    address,
    gstin,
    priceLevel,
    businessLine,
    userName,
    salesTeam,
    orderNo,
    orderDate,
    products,
    cgst,
    sgst,
    net
  } = body;

  if (
    !partyName ||
    !address ||
    !gstin ||
    !priceLevel ||
    !businessLine ||
    !userName ||
    !salesTeam ||
    !orderNo ||
    !orderDate
  ) {
    return "All fields required except narration";
  }

  if (!products || products.length === 0) {
    return "Products required";
  }

  for (let p of products) {
    if (!p.name || !p.qty || !p.rate) {
      return "Invalid product data";
    }
  }

  if (cgst < 0 || sgst < 0 || net < 0) {
    return "Invalid tax/net";
  }

  return null;
};
const converter = require("number-to-words");
const globalcompany = require("../models/globalcompany.js");
/* ========================= */
/* ✅ CREATE */
/* ========================= */

router.post("/", async (req, res) => {
  try {
    const { opid, partyName } = req.body;

    // ✅ 1. FETCH PROPOSAL
    const proposal = await opp.findOne({ proposalId: opid });
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    // ✅ 2. FETCH LEDGER (IMPORTANT)
    const ledger = await Ledger.findOne({ companyName: partyName });
    if (!ledger) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    // ✅ 3. CREATE FULL SALES ORDER DATA
    const salesOrderData = {
      // 🔹 Proposal
      proposalId: proposal.proposalId,
      companyName: ledger.companyName,
      priceLevel: proposal.priceLevel,
      businessLine: proposal.businessLine,
      tallySerials: proposal.tallySerials,

      // 🔹 Ledger
    //   companyId: ledger.companyId,

      contactName: ledger.contactName,
      contactMobile: ledger.contactMobile,
      contactEmail: ledger.contactEmail,

      address1: ledger.address1,
      address2: ledger.address2,
      address3: ledger.address3,
      state: ledger.state,
      district: ledger.district,
      city: ledger.city,
      pincode: ledger.pincode,

      gstType: ledger.gstType,
      gstin: ledger.gstin,
      pan: ledger.pan,
      tan: ledger.tan,
      msme: ledger.msme,

      // 🔹 Order Info (frontend)
      orderNo: req.body.orderNo,
      orderDate: req.body.orderDate,
      userName: req.body.userName,
      salesTeam: req.body.salesTeam,

      // 🔹 Products (from proposal)
      products: proposal.products,

      // 🔹 Financials (from proposal OR frontend if needed)
      discount: proposal.discount,
      grossTotal: proposal.total,
      cgstPercent: proposal.cgstPercent,
      sgstPercent: proposal.sgstPercent,
      cgst: proposal.cgst,
      sgst: proposal.sgst,
      roundoff: proposal.roundOff,
      subtotal: proposal.subtotal,
      net: proposal.net,

      // 🔹 Terms
      internalTerms: proposal.internalTerms,
      specialTerms: proposal.specialTerms,

      // 🔹 Bank
      bankDetails: proposal.bankDetails,

      // 🔹 Extra
      narration: req.body.narration || "",
      // 🔹 Billing / Invoice Info (NEW)
isBill: false,
isOutstanding: true,

invoiceNo: "",
invoiceDate: "",

invoiceAmount:  0,   // usually net amount
receivedAmount: 0,
pendingAmount: proposal.total || 0,
    };

    // ✅ 4. SAVE
    const order = new SalesOrder(salesOrderData);
    await order.save();

    // ✅ 5. UPDATE PROPOSAL STATUS
    await opp.findOneAndUpdate(
      { proposalId: opid },
      {
        proposalStatus: true,
        "statusDetails.status": "Close Won",
        "statusDetails.statusDate": new Date()
          .toISOString()
          .split("T")[0]
      }
    );

    res.status(201).json({
      success: true,
      message: "Sales Order Created with Full Data ✅",
      data: order
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
/* ========================= */
/* ✅ GET ALL */
/* ========================= */

router.get("/", async (req, res) => {
  try {
    const { startDate, endDate, businessLine, search } = req.query;

    let filter = {};

    // ✅ 1. DATE FILTER (based on createdAt)
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // ✅ 2. BUSINESS LINE FILTER
    if (businessLine) {
      filter.businessLine = businessLine;
    }

    // ✅ 3. SEARCH (Order No + Party Name)
    if (search) {
      filter.$or = [
        { orderNo: { $regex: search, $options: "i" } },
        { partyName: { $regex: search, $options: "i" } },
      ];
    }

    const data = await SalesOrder.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/sales-orders", async (req, res) => {
  try {
    const orders = await SalesOrder.find({ isOutstanding: true });

    // 🔥 Group orders by company
    const companyMap = {};

    orders.forEach((order) => {
      const name = order.companyName;

      if (!companyMap[name]) {
        companyMap[name] = {
          companyName: name,
          orders: [],
        };
      }

      companyMap[name].orders.push(order);
    });

    const companyNames = Object.keys(companyMap);

    // 🔥 Fetch ledger data
    const ledgers = await Ledger.find({
      companyName: { $in: companyNames },
    });

    // 🔥 Map ledger balance
    const ledgerMap = {};
    ledgers.forEach((l) => {
      ledgerMap[l.companyName] = l.balance || 0;
    });

    // 🔥 Final result
    const result = companyNames.map((name) => ({
      companyName: name,
      balance: ledgerMap[name] || 0,
      orders: companyMap[name].orders,
    }));

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/business-lines", async (req, res) => {
  try {
    const lines = await SalesOrder.distinct("businessLine");

    res.json({
      success: true,
      data: lines
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});




router.get("/sales-order", async (req, res) => {
  try {

    const {
      userName,
      search,
      businessLine,
      startDate,
      endDate,
    } = req.query;

    // ✅ username compulsory
    if (!userName) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }
    console.log("username",userName)

    const filter = {
      userName, // ✅ always filter by username
    };

    // ✅ company search
    if (search) {
      filter.companyName = {
        $regex: search,
        $options: "i",
      };
    }

    // ✅ business line
    if (businessLine) {
      filter.businessLine = businessLine;
    }

    // ✅ date filter
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const data = await SalesOrder.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data,
    });

  } catch (err) {

    res.status(500).json({
      error: err.message,
    });

  }
});

router.get("/invoice-pdf", async (req, res) => {
  try {
    const { ordid } = req.query;
    console.log({ordid});
    const companyData = await globalcompany.findOne();

    const company = {
      companyName: companyData?.companyName || "",
      gstin: companyData?.gstin || "",
      phone: companyData?.phone || "",
      email: companyData?.email || "",
      address: {
        line1: companyData?.address?.line1 || "",
        line2: companyData?.address?.line2 || "",
    // line3: companyData?.address?.line3 || "",
        state: companyData?.address?.state || "",
        city: companyData?.address?.city || "",
    pincode: companyData?.address?.pincode || ""
  }
    };

    const order = await SalesOrder.findOne({ orderNo: ordid });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // =========================
    // YOUR HTML GENERATION CODE
    // =========================

    const html = `
      <html>
        <body>
          <h1>Invoice</h1>
          <h2>${order.companyName}</h2>
        </body>
      </html>
    `;

    // =========================
    // GENERATE PDF
    // =========================

    const pdf = await generatePDF(html);

    // =========================
    // SAFE FILE NAME
    // =========================

    const safeCompanyName = (order.companyName || "invoice")
      .replace(/[<>:"/\\\\|?*]+/g, "")
      .replace(/\s+/g, "_");

    // =========================
    // RESPONSE HEADERS
    // =========================

    res.set({
      "Content-Type": "application/pdf",
<<<<<<< HEAD
      "Content-Disposition": `attachment; filename="${safeCompanyName}.pdf"`,
      "Content-Length": pdf.length,
=======
      "Content-Disposition": `attachment; filename="${order.companyName}.pdf"`
>>>>>>> bc8c9f7e62689b025f3049f66becf8073353e3c7
    });

    // =========================
    // SEND PDF
    // =========================

    res.send(pdf);

  } catch (err) {
    console.log(err);

    res.status(500).send("Error generating PDF");
  }
});

/* ========================= */
/* ✅ GET ONE */
/* ========================= */

router.get("/:id", async (req, res) => {
  try {
    const data = await SalesOrder.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ========================= */
/* ✅ UPDATE */
/* ========================= */

router.put("/:id", async (req, res) => {
  try {
    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });

    const updated = await SalesOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({
      success: true,
      message: "Updated",
      data: updated
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ========================= */
/* ✅ DELETE */
/* ========================= */

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await SalesOrder.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({
      success: true,
      message: "Deleted"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports = router;