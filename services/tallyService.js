const express = require("express");
const router = express.Router();
const axios = require("axios");
const SalesOrder = require("../models/SalesOrder");

const MIDDLEWARE_URL = "https://antarctic-whacky-hastiness.ngrok-free.dev/tally";

// 🔥 Convert SalesOrder → Tally XML
const buildXML = (order) => {

  const formatDate = (input) => {
    if (!input) return "20260425";
    const d = new Date(input);
    if (isNaN(d.getTime())) return "20260425";

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    return `${yyyy}${mm}${dd}`;
  };

  const date = formatDate(order.orderDate);

  const products = order.products || [];

  // 🔥 MULTIPLE ITEMS FROM YOUR SCHEMA
  const inventoryEntries = products.map(p => `
    <INVENTORYENTRIES.LIST>
      <STOCKITEMNAME>${p.name}</STOCKITEMNAME>
      <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
      <RATE>${p.rate}/Nos</RATE>
      <AMOUNT>${p.totalValue}</AMOUNT>
      <ACTUALQTY>${p.qty} Nos</ACTUALQTY>
      <BILLEDQTY>${p.qty} Nos</BILLEDQTY>
    </INVENTORYENTRIES.LIST>
  `).join("");

  // 🔥 GST LEDGERS (ONLY IF EXISTS)
  const gstEntries = `
    ${order.cgst > 0 ? `
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>CGST</LEDGERNAME>
      <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
      <AMOUNT>${order.cgst}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>` : ""}

    ${order.sgst > 0 ? `
    <ALLLEDGERENTRIES.LIST>
      <LEDGERNAME>SGST</LEDGERNAME>
      <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
      <AMOUNT>${order.sgst}</AMOUNT>
    </ALLLEDGERENTRIES.LIST>` : ""}
  `;

  return `
<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Import Data</TALLYREQUEST>
  <TYPE>Data</TYPE>
  <ID>Vouchers</ID>
 </HEADER>

 <BODY>
  <IMPORTDATA>
   <REQUESTDESC>
    <REPORTNAME>All Masters</REPORTNAME>
   </REQUESTDESC>

   <REQUESTDATA>
    <DATA>
     <TALLYMESSAGE xmlns:UDF="TallyUDF">

      <VOUCHER VCHTYPE="Sales" ACTION="Create">

        <DATE>20260101</DATE>
        <EFFECTIVEDATE>20260101</EFFECTIVEDATE>
        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
        <VOUCHERNUMBER>${order.orderNo}</VOUCHERNUMBER>

        <PARTYNAME>${order.companyName}</PARTYNAME>
        <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
        <ISINVOICE>Yes</ISINVOICE>

        <!-- 🔹 PARTY -->
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${order.companyName}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${order.net}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>

        <!-- 🔥 ITEMS -->
        ${inventoryEntries}

        <!-- 🔥 GST -->
        ${gstEntries}

      </VOUCHER>

     </TALLYMESSAGE>
    </DATA>
   </REQUESTDATA>
  </IMPORTDATA>
 </BODY>
</ENVELOPE>
`;
};

// 🔥 API: Push order to Tally
router.post("/push-to-tally/:id", async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    const xml = buildXML(order);

    const response = await axios.post(
      MIDDLEWARE_URL,
       xml,
      {
        headers: {
            "Content-Type": "application/xml",

          "ngrok-skip-browser-warning": "true"
        }
      }
    );

    res.json({
      success: true,
      tallyResponse: response.data
    });

  } catch (err) {
     console.log(err)
    res.status(500).json({
      error: err.message
     
    });
  }
});

module.exports = router;