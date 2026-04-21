const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const SalesOrder = require("../models/SalesOrder.js")
const opp = require("../models/Proposal"); // import model
/* ✅ VALIDATION FUNCTION */

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

/* ========================= */
/* ✅ CREATE */
/* ========================= */

router.post("/", async (req, res) => {
  try {
    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });

    const order = new SalesOrder(req.body);
    await order.save();

    // ✅ UPDATE PROPOSAL STATUS
if (req.body.opid) {
  await opp.findByIdAndUpdate(
    req.body.opid,
    {
      proposalStatus: true,
      "statusDetails.status": "Close Won",
      "statusDetails.statusDate": new Date().toISOString().split("T")[0]
    }
  );
}

    res.status(201).json({
      success: true,
      message: "Created & Proposal Closed Won",
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