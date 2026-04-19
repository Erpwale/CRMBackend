
const express = require("express");
const Ledger = require("../models/Ledger");


const router = express.Router();

/* ================= VALIDATION ================= */



/* ================= CREATE LEDGER ================= */

router.post("/", async (req, res) => {
  try {
    const {
      companyId,
      companyName,
  
      userName,
      contactEmail,
      contactMobile,
      address1,
      address2,
      address3,
      state,
      district,
      city,
      pincode,
      gstType,
      gstin,
      pan,
      tan,
      msme,
    } = req.body;

    // ✅ REQUIRED CHECK
  console.log("logs",req.body)
    if (
      !companyId || !companyName || !gstin || !pan || !contactEmail || !address1 || !state ||
      !district || !city || !pincode || !gstType|| !userName
    ) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // ✅ VALIDATION FUNCTIONS
    const isValidGSTIN = (gstin) =>
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/.test(gstin);
    

   const isValidPAN = (pan) =>
  /^[A-Z]{3}[PCGHABFTJL][A-Z][0-9]{4}[A-Z]$/.test(pan);

 const isValidTAN = (tan) =>
  /^[A-Z]{3}[A-Z][0-9]{5}[A-Z]$/.test(tan);

   const isValidMSME = (msme) =>
  /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/.test(msme);

    // ✅ APPLY VALIDATION
    if (!isValidGSTIN(gstin)) {
      return res.status(400).json({ message: "Invalid GSTIN format" });
    }
    const gstPan = gstin.substring(2, 12);

if (gstPan !== pan) {
  return res.status(400).json({
    message: "PAN does not match GSTIN",
  });
}

    if (!isValidPAN(pan)) {
      return res.status(400).json({ message: "Invalid PAN format" });
    }

    if (tan && !isValidTAN(tan)) {
      return res.status(400).json({ message: "Invalid TAN format" });
    }

    if (msme && !isValidMSME(msme)) {
      return res.status(400).json({ message: "Invalid MSME format" });
    }

    // 🔥 DUPLICATE CHECK
    const existing = await Ledger.findOne({
      companyId,
      $or: [{ gstin }, { pan }, { tan }, { msme }],
    });

    if (existing) {
      if (existing.gstin === gstin)
        return res.status(400).json({ message: "GSTIN exists in this company" });

      if (existing.pan === pan)
        return res.status(400).json({ message: "PAN exists in this company" });

      if (existing.tan === tan)
        return res.status(400).json({ message: "TAN exists in this company" });

      if (existing.msme === msme)
        return res.status(400).json({ message: "MSME exists in this company" });
    }

    // ✅ SAVE ALL FIELDS (IMPORTANT FIX)
    const ledger = await Ledger.create({
      companyId,
      companyName,
      contactEmail,
      contactName,
      contactMobile,
      address1,
      address2,
      address3,
      state,
      district,
      city,
      pincode,
      gstType,
      gstin,
      pan,
      tan,
      msme,
    });

    // ✅ SOCKET EMIT (CREATE)
const companyRoom = companyId.toString();

if (global.io) {
  console.log("📡 Emitting ledgerUpdated (CREATE) to:", companyRoom);

  global.io.to(companyRoom).emit("ledgerUpdated", {
    type: "CREATE",
    data: ledger,
  });
} else {
  console.log("❌ Socket not initialized");
}
    res.status(201).json({ message: "Ledger created", data: ledger });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= CHECK DUPLICATE ================= */

router.post("/check-duplicate", async (req, res) => {
  try {
    const { gstin, pan, tan, msme } = req.body;

    const existing = await Ledger.findOne({
      $or: [{ gstin }, { pan }, { tan }, { msme }],
    });

    if (!existing) {
      return res.json({ exists: false });
    }

    if (existing.gstin === gstin)
      return res.json({ exists: true, field: "GSTIN" });

    if (existing.pan === pan)
      return res.json({ exists: true, field: "PAN" });

    if (existing.tan === tan)
      return res.json({ exists: true, field: "TAN" });

    if (existing.msme === msme)
      return res.json({ exists: true, field: "MSME" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put("/ledger/:id", async (req, res) => {
  try {
    console.log("gg",req)
    const updated = await Ledger.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (global.io) {
      console.log("📡 Emitting ledgerUpdated (UPDATE) to:", companyRoom);

      global.io.to(companyRoom).emit("ledgerUpdated", {
        type: "UPDATE",
        data: updated,
      });
    }


    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/company/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;

    const ledgers = await Ledger.find({ companyId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: ledgers.length,
      data: ledgers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/", async (req, res) => {
  try {
    const ledgers = await Ledger.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: ledgers.length,
      data: ledgers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/:companyId/:id", async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const ledger = await Ledger.findOne({
      _id: id,
      companyId: companyId,
    });

    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: "Ledger not found for this company",
      });
    }

    res.json({
      success: true,
      data: ledger,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;