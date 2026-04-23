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
await opp.findOneAndUpdate(
  { proposalId: req.body.opid },   // ✅ match your field
  {
    proposalStatus: true,
    "statusDetails.status": "Close Won",
    "statusDetails.statusDate": new Date().toISOString().split("T")[0]
  }
);
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
router.get("/invoice-pdf", async (req, res) => {
  try {
    const html = `
    <!-- PASTE YOUR FULL HTML HERE -->
    <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Proforma Invoice</title>

<style>
  body {
    font-family: Arial, sans-serif;
    background: #eee;
    padding: 20px;
  }

  .invoice {
    width: 900px;
    margin: auto;
    background: #fff;
    border: 2px solid #000;
    padding: 10px;
  }

  .title {
    text-align: center;
    font-weight: bold;
    margin-bottom: 10px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  td, th {
    border: 1px solid #000;
    padding: 5px;
    vertical-align: top;
  }

  .no-border {
    border: none;
  }

  .bold {
    font-weight: bold;
  }

  .right {
    text-align: right;
  }

  .center {
    text-align: center;
  }

  .logo {
    text-align: center;
    font-size: 22px;
    font-weight: bold;
    color: #2b2b6f;
  }

  .section {
    margin-top: 5px;
  }

  .small {
    font-size: 11px;
  }

  .footer {
    text-align: center;
    font-size: 11px;
    margin-top: 10px;
  }
</style>
</head>

<body>

<div class="invoice">

  <div class="title">PROFORMA INVOICE</div>

  <!-- HEADER -->
  <table>
    <tr>
      <td style="width:60%">
        <div class="bold">MS ERPWALE PVT. LTD.</div>
        Flat No. J-201, Sai Avishkar<br>
        BH Omega, Haveli, Dhayari, Pune 411041<br>
        GSTIN/UIN: 27AATCM3926B1ZC<br>
        State Name: Maharashtra, Code: 27<br>
        Contact: 7447893013<br>
        E-Mail: info@erpwale.com
      </td>

      <td style="width:40%">
        <div class="logo">ERPWALE</div>
        <div class="center small">PRIVATE LIMITED</div>
      </td>
    </tr>
  </table>

  <!-- BUYER + ORDER -->
  <table class="section">
    <tr>
      <td style="width:60%">
        <b>Buyer (Bill to)</b><br>
        DECAN WATER TREATMENT PVT LTD<br>
        S.No.32, Behind Relax Hotel, Near Hari Om Steel,<br>
        Kharadi-Mundhwa Road, Pune<br>
        GSTIN/UIN: 27AABCD9828K1Z7<br>
        State Name: Maharashtra
      </td>

      <td style="width:40%">
        Sales Order Number: SO/ERP/26-27/001<br>
        Dated: 20-Apr-26<br>
        Reference No & Date:<br>
        Buyer’s Purchase Order No:<br>
      </td>
    </tr>
  </table>

  <!-- ITEMS -->
  <table class="section">
    <tr>
      <th>Sl No</th>
      <th>Description of Services</th>
      <th>Quantity</th>
      <th>Rate</th>
      <th>Per</th>
      <th>Disc %</th>
      <th>Amount</th>
    </tr>

    <tr>
      <td class="center">1</td>
      <td>
        <b>Tally Software Customization</b><br>
        <span class="small">Last Purchase Rate POP Up in Material Out Voucher - Tally Prime 7.0</span>
      </td>
      <td class="center">1 Nos</td>
      <td class="right">3,600.00</td>
      <td class="center">Nos</td>
      <td class="center">25%</td>
      <td class="right">2,700.00</td>
    </tr>

    <tr>
      <td colspan="6" class="right">Output CGST 9%</td>
      <td class="right">243.00</td>
    </tr>

    <tr>
      <td colspan="6" class="right">Output SGST 9%</td>
      <td class="right">243.00</td>
    </tr>

    <tr>
      <td colspan="6" class="right bold">Total</td>
      <td class="right bold">₹ 3,186.00</td>
    </tr>
  </table>

  <!-- AMOUNT IN WORDS -->
  <table class="section">
    <tr>
      <td>
        Amount Chargeable (in words):<br>
        <b>INR Three Thousand One Hundred Eighty Six Only</b>
      </td>
    </tr>
  </table>

  <!-- TAX SUMMARY -->
  <table class="section">
    <tr>
      <th>HSN/SAC</th>
      <th>Taxable Value</th>
      <th>CGST</th>
      <th>SGST</th>
      <th>Total Tax</th>
    </tr>

    <tr>
      <td>997331</td>
      <td class="right">2,700.00</td>
      <td class="right">243.00</td>
      <td class="right">243.00</td>
      <td class="right">486.00</td>
    </tr>
  </table>

  <!-- FOOT DETAILS -->
  <table class="section">
    <tr>
      <td style="width:60%">
        Company’s PAN: <b>AATCM3926B</b><br><br>

        Declaration:<br>
        We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
      </td>

      <td style="width:40%">
        Company’s Bank Details:<br>
        Bank Name: SBI Bank<br>
        A/c No: 44294074252<br>
        Branch: Solapur & IFSC Code: SBIN0007156<br><br>

        <div class="right">for MS ERPWALE PVT. LTD.</div><br><br>
        <div class="right">Authorised Signatory</div>
      </td>
    </tr>
  </table>

  <div class="footer">
    This is a Computer Generated Invoice
  </div>

</div>

</body>
</html>
    `;

    const pdf = await generatePDF(html);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=invoice.pdf"
    });

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