const express = require("express");
const router = express.Router();
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const Proposal= require("../models/Proposal")
const { authMiddleware, adminOnly } = require("../middleware/auth");

const headerBase64 = fs.readFileSync(
  path.join(__dirname, "../assets/header.jpg"),
  { encoding: "base64" }
);

const footerBase64 = fs.readFileSync(
  path.join(__dirname, "../assets/footer.jpg"),
  { encoding: "base64" }
);
router.post("/create", async (req, res) => {
 
  try {
    const data = req.body; // ✅ FIX
// ✅ CLONE FROM EXISTING PROPOSAL
console.log(data)
if (data.opid) {
const oldProposal = await Proposal.findOne({ proposalId: data.opid });
console.log(oldProposal)  
  if (!oldProposal) {
    return res.status(404).json({ message: "Not found" });
  }

  const oldData = oldProposal.toObject();

  Object.assign(data, {
    ...oldData,
    ...data, // ✅ new values override old
    _id: undefined,
    proposalId: undefined
  });
}
   const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  channel: "chromium", // ✅ FORCE real chromium
});

    const page = await browser.newPage();
    await page.goto("about:blank");

    // ✅ PRODUCTS TABLE
    const productRows = data.products.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>${item.rate}</td>
        <td style="text-align:right;">${item.totalValue}</td>
      </tr>
    `).join("");

    // ✅ CLEAN TERMS
    const cleanTerms = (html) => {
      if (!html) return [];

      let cleaned = html
        .replace(/<span class="ql-ui".*?<\/span>/g, "")
        .replace(/data-list="ordered"/g, "")
        .replace(/datalist="ordered"/g, "");

      const matches = cleaned.match(/<li[^>]*>(.*?)<\/li>/g) || [];

      return matches.map(item =>
        item.replace(/<li[^>]*>/, "").replace(/<\/li>/, "").trim()
      );
    };

    const rawTerms = Array.isArray(data.terms)
      ? data.terms.join("")
      : data.terms;

    const termsArray = cleanTerms(rawTerms);

    const termsHTML = `
      <ol>
        ${termsArray.map(t => `<li>${t}</li>`).join("")}
      </ol>
    `;

    // ✅ HTML TEMPLATE
   const html = `
<html>
<head>
<style>
  body {
    font-family: Arial, sans-serif;
    padding: 30px;
    font-size: 12px;
  }

  .header img {
    width: 100%;
    height: auto;
  }

  .title {
    text-align: center;
    font-weight: bold;
    margin: 10px 0;
  }

  .top-section {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
  }

  .left, .right {
    width: 48%;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
  }

  th, td {
    border: 1px solid #999;
    padding: 6px;
    text-align: center;
  }

  th {
    background-color: #f2f2f2;
  }

  .text-left {
    text-align: left;
  }

  .text-right {
    text-align: right;
  }

  .no-border td {
    border: none;
  }

  .summary-row td {
    font-weight: bold;
  }

  .terms {
    margin-top: 20px;
  }

</style>
</head>

<body>

<!-- HEADER -->
<div class="header">
  <img src="data:image/jpeg;base64,${headerBase64}" />
</div>

<div class="title">BUSINESS PROPOSAL</div>

<!-- TOP INFO -->
<div class="top-section">
  <div class="left">
    <b>To,</b><br/>
    ${data.companyName}<br/>
    ${data.address1}<br/>
    ${data.address2 || ""}<br/>
    ${data.state}, ${data.city} - ${data.pincode}
  </div>

  <div class="right text-right">
    <b>Date :</b> ${data.date}
  </div>
</div>

<br/>

<b>Kind Attn :</b> ${data.contactName}<br/>
<b>Subject :</b> Proposal of ${data.businessLine}

<!-- TABLE -->
<table>
  <tr>
    <th>Sr. No.</th>
    <th class="text-left">Particular</th>
    <th>Qty</th>
    <th>Rate</th>
    <th>Amount (Rs.)</th>
  </tr>

  ${data.products.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td class="text-left">${p.name}</td>
      <td>${p.qty}</td>
      <td>${p.rate}</td>
      <td class="text-right">${p.totalValue}</td>
    </tr>
  `).join("")}

  <!-- SUMMARY -->
  <tr>
    <td></td>
    <td class="text-right">Discount</td>
    <td></td>
    <td></td>
    <td class="text-right">${data.discount}</td>
  </tr>

  <tr>
    <td></td>
    <td class="text-right">Gross Total</td>
    <td></td>
    <td></td>
    <td class="text-right">${data.grossTotal}</td>
  </tr>

  <tr>
    <td></td>
    <td class="text-right">CGST (${data.cgstPercent}%)</td>
    <td></td>
    <td></td>
    <td class="text-right">${data.cgst}</td>
  </tr>

  <tr>
    <td></td>
    <td class="text-right">SGST (${data.sgstPercent}%)</td>
    <td></td>
    <td></td>
    <td class="text-right">${data.sgst}</td>
  </tr>

  <tr>
    <td></td>
    <td class="text-right">Round off</td>
    <td></td>
    <td></td>
    <td class="text-right">${data.roundOff}</td>
  </tr>

  <tr class="summary-row">
    <td></td>
    <td class="text-right">Total</td>
    <td></td>
    <td></td>
    <td class="text-right">${data.total}</td>
  </tr>

</table>

<!-- TERMS -->
<div class="terms">
  <b>Terms and Condition (${data.businessLine})</b><br/><br/>
  ${data.terms}
  Delivery : Immediate/Online/Soft License.<br/>
  Taxes : GST tax as applicable.
</div>

</body>
</html>
`;
  

    await page.setContent(html, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

res.setHeader("Content-Type", "application/pdf");
res.setHeader("Content-Disposition", "inline; filename=proposal.pdf");
    res.send(pdfBuffer);

  } catch (err) {
    console.error(err);
    if (browser) await browser.close();
    res.status(500).json({ message: "PDF generation failed" });
  }
});

router.post("/add", authMiddleware, async (req, res) => {
  try {
    console.log("REQ BODY:", req.body.bankDetails);

    // ✅ STEP 1: Get values
    const subtotal = req.body.subtotal || 0;
    const totalGST = req.body.gstTotal || 0;

    // ✅ STEP 2: Calculate total & roundOff (ADD HERE)
    const totalBeforeRound = subtotal + totalGST;
    const roundedTotal = Math.round(totalBeforeRound);
    const roundOff = +(roundedTotal - totalBeforeRound).toFixed(2);

    // ✅ STEP 3: Create data object
    const data = {
      ...req.body,

      cgst: +(totalGST / 2).toFixed(2),
      sgst: +(totalGST / 2).toFixed(2),

      // ✅ ADD THESE TWO
      roundOff,
      total: roundedTotal,

      uid: req.user._id,
      userName: req.user.name,
      email: req.user.email,
      mobile: req.user.mobile
    };

    console.log("RoundOff:", roundOff); // 🔍 debug

    if (!data.companyName) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const newProposal = new Proposal(data);
    const savedData = await newProposal.save();

    if (global.io) {
      global.io.emit("opportunityUpdated", {
        type: "CREATE",
        data: savedData,
      });
    } else {
      console.log("❌ Socket not initialized or companyId missing");
    }

    res.status(201).json({
      message: "Proposal saved successfully",
      data: savedData
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error saving data" });
  }
});

router.get("/my-opportunities", authMiddleware, async (req, res) => {
  try {
    const { companyName } = req.query;

    const data = await Proposal.find({
      companyName: { $regex: `^${companyName}$`, $options: "i" }
    }).sort({ createdAt: -1 });

    res.status(200).json({ data });

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

module.exports = router;