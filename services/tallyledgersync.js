
const axios = require("axios");

const TALLY_URL = process.env.TALLY_URL;
const TALLY_TIMEOUT = 10000;

const escapeXML = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const generateLedgerXML = (ledger) => `
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
          <LEDGER NAME="${escapeXML(ledger.companyName)}" ACTION="Create">
            <NAME>${escapeXML(ledger.companyName)}</NAME>
            <PARENT>Sundry Debtors</PARENT>
            <MAILINGNAME>${escapeXML(ledger.companyName)}</MAILINGNAME>
            <ADDRESS.LIST TYPE="String">
              <ADDRESS>${escapeXML(ledger.address1)}</ADDRESS>
              <ADDRESS>${escapeXML(ledger.address2)}</ADDRESS>
              <ADDRESS>${escapeXML(ledger.address3)}</ADDRESS>
            </ADDRESS.LIST>
            <STATENAME>${escapeXML(ledger.state)}</STATENAME>
            <PINCODE>${escapeXML(ledger.pincode)}</PINCODE>
            <LEDGERCONTACT>${escapeXML(ledger.contactName)}</LEDGERCONTACT>
            <LEDGERPHONE>${escapeXML(ledger.contactMobile)}</LEDGERPHONE>
            <EMAIL>${escapeXML(ledger.contactEmail)}</EMAIL>
            <INCOMETAXNUMBER>${escapeXML(ledger.pan)}</INCOMETAXNUMBER>
            <GSTREGISTRATIONTYPE>${escapeXML(ledger.gstType)}</GSTREGISTRATIONTYPE>
            <PARTYGSTIN>${escapeXML(ledger.gstin)}</PARTYGSTIN>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

const verifyTallyResponse = (response) => {
  const xml = String(response || "");

  const getNumber = (tag) => {
    const match = xml.match(
      new RegExp(`<${tag}>\\s*(\\d+)\\s*</${tag}>`, "i")
    );

    return match ? Number(match[1]) : null;
  };

  const errors = getNumber("ERRORS");
  const created = getNumber("CREATED");
  const altered = getNumber("ALTERED");

  const lineError = xml.match(
    /<LINEERROR>([\s\S]*?)<\/LINEERROR>/i
  );

  if (lineError || (errors !== null && errors > 0)) {
    return {
      success: false,
      message: lineError
        ? lineError[1].trim()
        : `Tally import errors: ${errors}`
    };
  }

  if (
    errors === 0 &&
    (created > 0 || altered > 0)
  ) {
    return {
      success: true,
      message: "Ledger successfully imported into Tally"
    };
  }

  return {
    success: false,
    message: "Tally import could not be verified"
  };
};

const syncLedgerToTally = async (ledger) => {
  if (!TALLY_URL) {
    throw new Error("TALLY_URL is not configured");
  }

  const xml = generateLedgerXML(ledger);

  const response = await axios.post(
    TALLY_URL,
    xml,
    {
      headers: {
        "Content-Type": "application/xml"
      },
      timeout: TALLY_TIMEOUT
    }
  );

  const result = verifyTallyResponse(response.data);

  if (!result.success) {
    throw new Error(result.message);
  }

  return {
    success: true,
    message: result.message
  };
};

module.exports = {
  syncLedgerToTally
};