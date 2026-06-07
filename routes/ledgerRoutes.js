
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
  !companyId ||
  !companyName ||
  !pan ||
  !contactEmail ||
  !address1 ||
  !state ||
  !district ||
  !city ||
  !pincode ||
  !gstType ||
  !userName
) {
  return res.status(400).json({ message: "Required fields missing" });
}

// GSTIN required only for GST registered types
if (
  gstType !== "Unregistered" &&
  gstType !== "Consumer" &&
  !gstin
) {
  return res.status(400).json({
    message: "GSTIN is required for registered businesses"
  });
}
 // ✅ VALIDATION FUNCTIONS
// ================= STATE CODES =================

const GST_STATE_CODES = {
  "Jammu & Kashmir": "01",
  "Himachal Pradesh": "02",
  "Punjab": "03",
  "Chandigarh": "04",
  "Uttarakhand": "05",
  "Haryana": "06",
  "Delhi": "07",
  "Rajasthan": "08",
  "Uttar Pradesh": "09",
  "Bihar": "10",
  "Sikkim": "11",
  "Arunachal Pradesh": "12",
  "Nagaland": "13",
  "Manipur": "14",
  "Mizoram": "15",
  "Tripura": "16",
  "Meghalaya": "17",
  "Assam": "18",
  "West Bengal": "19",
  "Jharkhand": "20",
  "Odisha": "21",
  "Chhattisgarh": "22",
  "Madhya Pradesh": "23",
  "Gujarat": "24",
  "Daman & Diu": "25",
  "Dadra & Nagar Haveli": "26",
  "Maharashtra": "27",
  "Andhra Pradesh (Old)": "28",
  "Karnataka": "29",
  "Goa": "30",
  "Lakshadweep": "31",
  "Kerala": "32",
  "Tamil Nadu": "33",
  "Puducherry": "34",
  "Andaman & Nicobar Islands": "35",
  "Telangana": "36",
  "Andhra Pradesh": "37",
  "Ladakh": "38",
  "Other Territory": "97",
  "Centre Jurisdiction": "99",
};

// ================= VALIDATORS =================

const isValidPAN = (pan) =>
  /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
    pan?.toUpperCase().trim()
  );

const isValidTAN = (tan) =>
  /^[A-Z]{4}[0-9]{5}[A-Z]$/.test(
    tan?.toUpperCase().trim()
  );

const isValidMSME = (msme) =>
  /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(
    msme?.toUpperCase().trim()
  );

const isValidGSTIN = (gstin, selectedState, pan) => {
  gstin = gstin?.toUpperCase().trim();
  pan = pan?.toUpperCase().trim();

  const gstRegex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const gstTypeValue = gstType?.trim().toLowerCase();
if (
  gstType !== "Unregistered" &&
  gstType !== "Consumer"
) {
  const gstValidation = isValidGSTIN(
    gstin,
    state,
    pan
  );

  if (!gstValidation.valid) {
    return res.status(400).json({
      message: gstValidation.message,
    });
  }
}
  const expectedStateCode =
    GST_STATE_CODES[selectedState];

  if (!expectedStateCode) {
    return {
      valid: false,
      message: "Invalid State Selected",
    };
  }

  const gstStateCode = gstin.substring(0, 2);

  if (gstStateCode !== expectedStateCode) {
    return {
      valid: false,
      message: `GST State Code should be ${expectedStateCode} for ${selectedState}`,
    };
  }

  const gstPan = gstin.substring(2, 12);

  if (gstPan !== pan) {
    return {
      valid: false,
      message: "GSTIN PAN does not match PAN Number",
    };
  }

  return {
    valid: true,
    message: "Valid GSTIN",
  };
};

// const isValidTAN = (tan) =>
//   /^[A-Z]{4}[0-9]{5}[A-Z]$/.test(tan);

// const isValidMSME = (msme) =>
//   /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(msme);


// ✅ APPLY VALIDATION
// ================= PAN =================

if (!isValidPAN(pan)) {
  return res.status(400).json({
    message: "Invalid PAN format",
  });
}

// ================= GST =================

const gstValidation = isValidGSTIN(
  gstin,
  state,
  pan
);

if (!gstValidation.valid) {
  return res.status(400).json({
    message: gstValidation.message,
  });
}

// ================= TAN =================

if (tan && !isValidTAN(tan)) {
  return res.status(400).json({
    message: "Invalid TAN format",
  });
}

// ================= MSME =================

if (msme && !isValidMSME(msme)) {
  return res.status(400).json({
    message: "Invalid MSME format",
  });
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
      userName,
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
    const updated = await Ledger.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Ledger not found",
      });
    }

    const companyRoom = updated.companyId.toString();

    if (global.io) {
      global.io.to(companyRoom).emit(
        "ledgerUpdated",
        {
          type: "UPDATE",
          data: updated,
        }
      );
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
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