
const express = require("express");
const Ledger = require("../models/Ledger");
const axios = require("axios");
const logActivity = require("../utils/Activitylog");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

/* =====================================================
   CONFIGURATION
===================================================== */

const TALLY_URL = process.env.TALLY_URL;

const TALLY_TIMEOUT = 5000;

/* =====================================================
   GST STATE CODES
===================================================== */

const GST_STATE_CODES = {
  "Jammu & Kashmir": "01",
  "Himachal Pradesh": "02",
  Punjab: "03",
  Chandigarh: "04",
  Uttarakhand: "05",
  Haryana: "06",
  Delhi: "07",
  Rajasthan: "08",
  "Uttar Pradesh": "09",
  Bihar: "10",
  Sikkim: "11",
  "Arunachal Pradesh": "12",
  Nagaland: "13",
  Manipur: "14",
  Mizoram: "15",
  Tripura: "16",
  Meghalaya: "17",
  Assam: "18",
  "West Bengal": "19",
  Jharkhand: "20",
  Odisha: "21",
  Chhattisgarh: "22",
  "Madhya Pradesh": "23",
  Gujarat: "24",
  "Daman & Diu": "25",
  "Dadra & Nagar Haveli": "26",
  Maharashtra: "27",
  "Andhra Pradesh (Old)": "28",
  Karnataka: "29",
  Goa: "30",
  Lakshadweep: "31",
  Kerala: "32",
  "Tamil Nadu": "33",
  Puducherry: "34",
  "Andaman & Nicobar Islands": "35",
  Telangana: "36",
  "Andhra Pradesh": "37",
  Ladakh: "38",
  "Other Territory": "97",
  "Centre Jurisdiction": "99",
};

/* =====================================================
   VALIDATION FUNCTIONS
===================================================== */

const normalize = (value) =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

const isValidPAN = (pan) =>
  /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(normalize(pan));

const isValidTAN = (tan) =>
  /^[A-Z]{4}[0-9]{5}[A-Z]$/.test(normalize(tan));

const isValidMSME = (msme) =>
  /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(normalize(msme));

const isValidGSTIN = (
  gstin,
  selectedState,
  pan,
  gstType
) => {
  const type = (gstType || "").trim().toLowerCase();

  if (type === "unregistered" || type === "consumer") {
    return {
      valid: true,
      message: "GST validation skipped",
    };
  }

  const normalizedGSTIN = normalize(gstin);
  const normalizedPAN = normalize(pan);

  const gstRegex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

  if (!gstRegex.test(normalizedGSTIN)) {
    return {
      valid: false,
      message: "Invalid GSTIN format",
    };
  }

  const expectedStateCode = GST_STATE_CODES[selectedState];

  if (!expectedStateCode) {
    return {
      valid: false,
      message: "Invalid State Selected",
    };
  }

  if (normalizedGSTIN.substring(0, 2) !== expectedStateCode) {
    return {
      valid: false,
      message: `GST State Code should be ${expectedStateCode} for ${selectedState}`,
    };
  }

  const gstPAN = normalizedGSTIN.substring(2, 12);

  if (gstPAN !== normalizedPAN) {
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

/* =====================================================
   XML ESCAPE FUNCTION
===================================================== */

const escapeXML = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

/* =====================================================
   GENERATE TALLY XML
===================================================== */

const generateLedgerXML = (ledger) => {
  const {
    companyName,
    address1,
    address2,
    address3,
    state,
    pincode,
    contactName,
    contactMobile,
    contactEmail,
    pan,
    gstType,
    gstin,
  } = ledger;

  return `
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

          <LEDGER NAME="${escapeXML(companyName)}" ACTION="Create">

            <NAME>${escapeXML(companyName)}</NAME>

            <PARENT>Sundry Debtors</PARENT>

            <MAILINGNAME>${escapeXML(companyName)}</MAILINGNAME>

            <ADDRESS.LIST TYPE="String">
              <ADDRESS>${escapeXML(address1)}</ADDRESS>
              <ADDRESS>${escapeXML(address2)}</ADDRESS>
              <ADDRESS>${escapeXML(address3)}</ADDRESS>
            </ADDRESS.LIST>

            <STATENAME>${escapeXML(state)}</STATENAME>

            <PINCODE>${escapeXML(pincode)}</PINCODE>

            <LEDGERCONTACT>${escapeXML(contactName)}</LEDGERCONTACT>

            <LEDGERPHONE>${escapeXML(contactMobile)}</LEDGERPHONE>

            <EMAIL>${escapeXML(contactEmail)}</EMAIL>

            <INCOMETAXNUMBER>${escapeXML(pan)}</INCOMETAXNUMBER>

            <GSTREGISTRATIONTYPE>${escapeXML(gstType)}</GSTREGISTRATIONTYPE>

            <PARTYGSTIN>${escapeXML(gstin)}</PARTYGSTIN>

          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
};

/* =====================================================
   CHECK TALLY RESPONSE
===================================================== */

const checkTallyResponse = (response) => {
  const responseXML = String(response || "");

  const errorsMatch = responseXML.match(
    /<ERRORS>\s*(\d+)\s*<\/ERRORS>/i
  );

  const createdMatch = responseXML.match(
    /<CREATED>\s*(\d+)\s*<\/CREATED>/i
  );

  const alteredMatch = responseXML.match(
    /<ALTERED>\s*(\d+)\s*<\/ALTERED>/i
  );

  const lineErrorMatch = responseXML.match(
    /<LINEERROR>([\s\S]*?)<\/LINEERROR>/i
  );

  const errors = errorsMatch
    ? Number(errorsMatch[1])
    : null;

  const created = createdMatch
    ? Number(createdMatch[1])
    : 0;

  const altered = alteredMatch
    ? Number(alteredMatch[1])
    : 0;

  const lineError = lineErrorMatch
    ? lineErrorMatch[1].trim()
    : "";

  if (lineError || (errors !== null && errors > 0)) {
    return {
      success: false,
      message: lineError || `Tally import errors: ${errors}`,
    };
  }

  if (
    errors === 0 &&
    (created > 0 || altered > 0)
  ) {
    return {
      success: true,
      message: "Ledger imported successfully in Tally",
    };
  }

  return {
    success: false,
    message:
      "Tally responded, but successful ledger import could not be verified.",
  };
};

/* =====================================================
   CREATE LEDGER
===================================================== */

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

    console.log("Ledger Request:", req.body);

    /* ================= REQUIRED VALIDATION ================= */

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
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    /* ================= GST REQUIRED ================= */

    const gstTypeValue = gstType.trim().toLowerCase();

    if (
      gstTypeValue !== "unregistered" &&
      gstTypeValue !== "consumer" &&
      !gstin
    ) {
      return res.status(400).json({
        message: "GSTIN is required for registered businesses",
      });
    }

    /* ================= PAN VALIDATION ================= */

    const normalizedPAN = normalize(pan);

    if (!isValidPAN(normalizedPAN)) {
      return res.status(400).json({
        message: "Invalid PAN format",
      });
    }

    /* ================= GST VALIDATION ================= */

    const normalizedGSTIN = normalize(gstin);

    const gstValidation = isValidGSTIN(
      normalizedGSTIN,
      state,
      normalizedPAN,
      gstType
    );

    if (!gstValidation.valid) {
      return res.status(400).json({
        message: gstValidation.message,
      });
    }

    /* ================= TAN VALIDATION ================= */

    const normalizedTAN = normalize(tan);

    if (normalizedTAN && !isValidTAN(normalizedTAN)) {
      return res.status(400).json({
        message: "Invalid TAN format",
      });
    }

    /* ================= MSME VALIDATION ================= */

    const normalizedMSME = normalize(msme);

    if (normalizedMSME && !isValidMSME(normalizedMSME)) {
      return res.status(400).json({
        message: "Invalid MSME format",
      });
    }

    /* ================= DUPLICATE CHECK ================= */

    const duplicateChecks = [];

    if (normalizedGSTIN) {
      duplicateChecks.push({ gstin: normalizedGSTIN });
    }

    if (normalizedPAN) {
      duplicateChecks.push({ pan: normalizedPAN });
    }

    if (normalizedTAN) {
      duplicateChecks.push({ tan: normalizedTAN });
    }

    if (normalizedMSME) {
      duplicateChecks.push({ msme: normalizedMSME });
    }

    const existing = duplicateChecks.length
      ? await Ledger.findOne({
          companyId,
          $or: duplicateChecks,
        })
      : null;

    if (existing) {
      if (
        normalizedGSTIN &&
        normalize(existing.gstin) === normalizedGSTIN
      ) {
        return res.status(400).json({
          message: "GSTIN exists in this company",
        });
      }

      if (
        normalizedPAN &&
        normalize(existing.pan) === normalizedPAN
      ) {
        return res.status(400).json({
          message: "PAN exists in this company",
        });
      }

      if (
        normalizedTAN &&
        normalize(existing.tan) === normalizedTAN
      ) {
        return res.status(400).json({
          message: "TAN exists in this company",
        });
      }

      if (
        normalizedMSME &&
        normalize(existing.msme) === normalizedMSME
      ) {
        return res.status(400).json({
          message: "MSME exists in this company",
        });
      }
    }

    /* ================= SAVE LEDGER IN MONGODB ================= */

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
      gstin: normalizedGSTIN || undefined,
      pan: normalizedPAN,
      tan: normalizedTAN || undefined,
      msme: normalizedMSME || undefined,

      tallySyncStatus: "PENDING",
      tallySyncError: null,
      tallySyncedAt: null,
    });

    console.log("Ledger saved:", ledger._id);

    /* ================= ACTIVITY LOG ================= */

    try {
      await logActivity({
        req,
        userId: req.user.id,
        module: "LEDGER",
        action: "CREATE",
        description: `Created ledger for ${companyName}`,
        recordId: ledger._id,
        recordName: companyName,
      });
    } catch (activityError) {
      console.error(
        "Activity log failed:",
        activityError.message
      );
    }

    /* ================= TALLY SYNC ================= */

    let tallyStatus = "PENDING";
    let tallyMessage = "Ledger saved. Tally sync pending.";

    if (!TALLY_URL) {
      tallyMessage =
        "Ledger saved in MongoDB. TALLY_URL is not configured.";
    } else {
      try {
        const xml = generateLedgerXML(ledger);

        const tallyResponse = await axios.post(
          TALLY_URL,
          xml,
          {
            headers: {
              "Content-Type": "application/xml",
            },
            timeout: TALLY_TIMEOUT,
          }
        );

        console.log(
          "Tally Response:",
          tallyResponse.data
        );

        const result = checkTallyResponse(
          tallyResponse.data
        );

        if (result.success) {
          tallyStatus = "SYNCED";
          tallyMessage = result.message;
        } else {
          tallyStatus = "FAILED";
          tallyMessage = result.message;
        }
      } catch (tallyError) {
        console.error(
          "Tally Connection Error:",
          tallyError.message
        );

        tallyStatus = "PENDING";

        tallyMessage =
          "Ledger saved in MongoDB. Tally is offline. Sync pending.";
      }
    }

    /* ================= UPDATE TALLY STATUS ================= */

    const updatedLedger = await Ledger.findByIdAndUpdate(
      ledger._id,
      {
        tallySyncStatus: tallyStatus,
        tallySyncError:
          tallyStatus === "SYNCED" ? null : tallyMessage,
        tallySyncedAt:
          tallyStatus === "SYNCED" ? new Date() : null,
      },
      {
        new: true,
      }
    );

    /* ================= SOCKET EMIT ================= */

    const companyRoom = companyId.toString();

    if (global.io) {
      console.log(
        "Emitting ledgerUpdated CREATE:",
        companyRoom
      );

      global.io.to(companyRoom).emit("ledgerUpdated", {
        type: "CREATE",
        data: updatedLedger,
      });
    }

    /* ================= SUCCESS RESPONSE ================= */

    return res.status(201).json({
      message: "Ledger created successfully",
      tallyStatus,
      tallyMessage,
      data: updatedLedger,
    });

  } catch (err) {
    console.error("Create Ledger Error:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
});

/* =====================================================
   CHECK DUPLICATE
===================================================== */

router.post("/check-duplicate", async (req, res) => {
  try {
    const { gstin, pan, tan, msme, companyId } = req.body;

    const duplicateChecks = [];

    if (gstin) duplicateChecks.push({ gstin: normalize(gstin) });
    if (pan) duplicateChecks.push({ pan: normalize(pan) });
    if (tan) duplicateChecks.push({ tan: normalize(tan) });
    if (msme) duplicateChecks.push({ msme: normalize(msme) });

    if (!duplicateChecks.length) {
      return res.json({
        exists: false,
      });
    }

    const query = {
      $or: duplicateChecks,
    };

    if (companyId) {
      query.companyId = companyId;
    }

    const existing = await Ledger.findOne(query);

    if (!existing) {
      return res.json({
        exists: false,
      });
    }

    if (
      gstin &&
      normalize(existing.gstin) === normalize(gstin)
    ) {
      return res.json({
        exists: true,
        field: "GSTIN",
      });
    }

    if (
      pan &&
      normalize(existing.pan) === normalize(pan)
    ) {
      return res.json({
        exists: true,
        field: "PAN",
      });
    }

    if (
      tan &&
      normalize(existing.tan) === normalize(tan)
    ) {
      return res.json({
        exists: true,
        field: "TAN",
      });
    }

    if (
      msme &&
      normalize(existing.msme) === normalize(msme)
    ) {
      return res.json({
        exists: true,
        field: "MSME",
      });
    }

    return res.json({
      exists: false,
    });

  } catch (err) {
    console.error("Duplicate Check Error:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
});

/* =====================================================
   UPDATE LEDGER
===================================================== */

router.put("/ledger/:id", authMiddleware, async (req, res) => {
  try {
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

    /* ================= SOCKET ================= */

    if (global.io) {
      global.io.to(updated.companyId.toString()).emit(
        "ledgerUpdated",
        {
          type: "UPDATE",
          data: updated,
        }
      );

      console.log("Ledger UPDATE emitted");
    }

    return res.json({
      message: "Ledger updated successfully",
      data: updated,
    });

  } catch (err) {
    console.error("Update Ledger Error:", err);

    return res.status(500).json({
      error: err.message,
    });
  }
});

/* =====================================================
   GET LEDGERS BY COMPANY
===================================================== */

router.get("/company/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;

    const ledgers = await Ledger.find({
      companyId,
    }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: ledgers.length,
      data: ledgers,
    });

  } catch (err) {
    console.error("Get Company Ledgers Error:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
});

/* =====================================================
   GET ALL LEDGERS
===================================================== */

router.get("/", async (req, res) => {
  try {
    const ledgers = await Ledger.find().sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: ledgers.length,
      data: ledgers,
    });

  } catch (err) {
    console.error("Get All Ledgers Error:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
});

/* =====================================================
   GET SINGLE LEDGER
===================================================== */

router.get("/:companyId/:id", async (req, res) => {
  try {
    const { companyId, id } = req.params;

    const ledger = await Ledger.findOne({
      _id: id,
      companyId,
    });

    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: "Ledger not found for this company",
      });
    }

    return res.json({
      success: true,
      data: ledger,
    });

  } catch (err) {
    console.error("Get Single Ledger Error:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
});

module.exports = router;