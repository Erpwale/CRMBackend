const express = require("express");
const router = express.Router();
const axios = require("axios");
const SalesOrder = require("../models/SalesOrder");

const MIDDLEWARE_URL = "https://antarctic-whacky-hastiness.ngrok-free.dev/tally";

// 🔥 Convert SalesOrder → Tally XML
const buildXML = (order) => {
  const formatDate = (input) => {
    const d = new Date(input);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
  };

  const date = formatDate(order.orderDate);

  return `
<ENVELOPE>
 <HEADER>
  <TALLYREQUEST>Import Data</TALLYREQUEST>
 </HEADER>
 <BODY>
  <IMPORTDATA>
   <REQUESTDESC>
    <REPORTNAME>Vouchers</REPORTNAME>
   </REQUESTDESC>
   <REQUESTDATA>
    <TALLYMESSAGE>
    
     <VOUCHER ACTION="Create" OBJVIEW="Invoice Voucher View">

      <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
      <VOUCHERNUMBER>${order.orderNo}</VOUCHERNUMBER>

      <DATE>20260425</DATE>
<EFFECTIVEDATE>20260425</EFFECTIVEDATE>

      <PARTYNAME>${order.companyName}</PARTYNAME>

      <ISINVOICE>Yes</ISINVOICE>
      <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>

      <!-- Party -->
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>${order.companyName}</LEDGERNAME>
        <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
        <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
        <AMOUNT>-${order.net}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>

      <!-- Products -->
      ${order.products.map(p => `
        <ALLINVENTORYENTRIES.LIST>
          <STOCKITEMNAME>${p.name}</STOCKITEMNAME>
          <RATE>${p.rate}</RATE>
          <AMOUNT>${p.totalValue}</AMOUNT>
          <ACTUALQTY>${p.qty} Nos</ACTUALQTY>
          <BILLEDQTY>${p.qty} Nos</BILLEDQTY>
        </ALLINVENTORYENTRIES.LIST>
      `).join("")}

      <!-- GST -->
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>CGST</LEDGERNAME>
        <AMOUNT>${order.cgst}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>

      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>SGST</LEDGERNAME>
        <AMOUNT>${order.sgst}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>

     </VOUCHER>

    </TALLYMESSAGE>
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
      { xml },
      {
        headers: {
          "ngrok-skip-browser-warning": "true"
        }
      }
    );

    res.json({
      success: true,
      tallyResponse: response.data
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;