
const express = require("express");
const Ledger = require("../models/Ledger");
const axios = require("axios");
const logActivity = require("../utils/Activitylog");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

/* ================= VALIDATION ================= */



/* ================= CREATE LEDGER ================= */

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      companyId,
      companyName,
      contactName,
      contactId,
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

const isValidGSTIN = (
  gstin,
  selectedState,
  pan,
  gstType
) => {
  const gstTypeValue = (gstType || "")
    .trim()
    .toLowerCase();

  // Skip GST validation for Unregistered & Consumer
  if (
    gstTypeValue === "unregistered" ||
    gstTypeValue === "consumer"
  ) {
    return {
      valid: true,
      message: "GST validation skipped",
    };
  }

  gstin = gstin?.toUpperCase().trim();
  pan = pan?.toUpperCase().trim();

  const gstRegex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

  if (!gstRegex.test(gstin)) {
    return {
      valid: false,
      message: "Invalid GSTIN format",
    };
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
  pan,
  gstType
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
 
const duplicateChecks = [];

if (gstin) duplicateChecks.push({ gstin });
if (pan) duplicateChecks.push({ pan });
if (tan) duplicateChecks.push({ tan });
if (msme) duplicateChecks.push({ msme });

const existing =
  duplicateChecks.length > 0
    ? await Ledger.findOne({
        companyId,
        $or: duplicateChecks,
      })
    : null;

   if (existing) {
  if (gstin && existing.gstin === gstin)
    return res.status(400).json({
      message: "GSTIN exists in this company",
    });

  if (pan && existing.pan === pan)
    return res.status(400).json({
      message: "PAN exists in this company",
    });

  if (tan && existing.tan === tan)
    return res.status(400).json({
      message: "TAN exists in this company",
    });

  if (msme && existing.msme === msme)
    return res.status(400).json({
      message: "MSME exists in this company",
    });
}

    // ✅ SAVE ALL FIELDS (IMPORTANT FIX)
    const ledger = await Ledger.create({
      companyId,
      companyName,
      contactEmail,
      contactId,
      userName,
      contactMobile,
      contactName,
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
await logActivity({
  req,
  userId: req.user.id,
  module: "LEDGER",
  action: "CREATE",
  description: `Created ledger for ${companyName}`,
  recordId: ledger._id,
  recordName: companyName,
});
      // ===========================
    // SEND TO TALLY
    // ===========================

    const xml = `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>

  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
      </REQUESTDESC>

      <REQUESTDATA>

        <TALLYMESSAGE xmlns:UDF="TallyUDF">

          <LEDGER NAME="${companyName}" ACTION="Create">

            <NAME>${companyName}</NAME>

            <PARENT>Sundry Debtors</PARENT>

            <MAILINGNAME>${companyName}</MAILINGNAME>

            <ADDRESS.LIST TYPE="String">
              <ADDRESS>${address1 || ""}</ADDRESS>
              <ADDRESS>${address2 || ""}</ADDRESS>
              <ADDRESS>${address3 || ""}</ADDRESS>
            </ADDRESS.LIST>

            <STATENAME>${state}</STATENAME>

            <PINCODE>${pincode}</PINCODE>

            <LEDGERCONTACT>${contactName}</LEDGERCONTACT>

            <LEDGERPHONE>${contactMobile || ""}</LEDGERPHONE>

            <EMAIL>${contactEmail}</EMAIL>

            <INCOMETAXNUMBER>${pan || ""}</INCOMETAXNUMBER>

            <GSTREGISTRATIONTYPE>${gstType}</GSTREGISTRATIONTYPE>

            <PARTYGSTIN>${gstin || ""}</PARTYGSTIN>

          </LEDGER>

        </TALLYMESSAGE>

      </REQUESTDATA>

    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    const tallyResponse = await axios.post(
      "  https://antarctic-whacky-hastiness.ngrok-free.dev",
      xml,
      {
        headers: {
          "Content-Type": "application/xml",
        },
      }
    );

    console.log("Tally Response:", tallyResponse.data);


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
router.put("/ledger/:id", authMiddleware, async (req, res) => {  try {

    const updated = await Ledger.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Ledger not found",
      });
    }
    await logActivity({
  req,
  userId: req.user.id,
  module: "LEDGER",
  action: "UPDATE",
  description: `Updated ledger for ${updated.companyName}`,
  recordId: updated._id,
  recordName: updated.companyName,
});

    // ✅ Socket
    if (global.io) {

      global.io.to(updated.companyId.toString()).emit(
        "ledgerUpdated",
        {
          type: "UPDATE",
          data: updated,
        }
      );

      console.log("✅ Ledger UPDATE emitted");

    }

    res.json(updated);

  } catch (err) {

    console.log(err);

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