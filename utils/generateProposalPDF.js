const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const generateProposalPDF = async (data) => {
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

const headerBase64 = fs.readFileSync(
  path.join(__dirname, "../assets/header.jpg"),
  { encoding: "base64" }
);

const footerBase64 = fs.readFileSync(
  path.join(__dirname, "../assets/footer.jpg"),
  { encoding: "base64" }
);
    const page = await browser.newPage();

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

const termsHTML = `
<div style="page-break-before: always;">

  <h3>Terms & Conditions</h3>

  ${data.products.map(p => `
    <div style="margin-bottom:10px;">
      <b>${p.name}</b>
      <div>${p.terms || ""}</div>
    </div>
  `).join("")}

  ${data.internalTerms ? `
    <div><b>Internal Terms</b><br/>${data.internalTerms}</div>
  ` : ""}

  ${data.specialTerms ? `
    <div><b>Special Terms</b><br/>${data.specialTerms}</div>
  ` : ""}

</div>
`;
console.log("termsHTML:", termsHTML);
const maxRows = 10;

const productRows = data.products.map((p, i) => `
<tr>
  <td class="center">${i + 1}</td>
   <td class="left bold">${p.name || ""}</td>
  <td class="center">${p.qty || ""}</td>
  <td class="right">${p.rate || ""}</td>
  <td class="right">${p.totalValue || ""}</td>
</tr>
`).join("");

const emptyRows = Array.from({
  length: Math.max(0, maxRows - data.products.length)
}).map((_, i) => `
<tr>
  <td></td>
  <td>&nbsp;</td>
  <td></td>
  <td></td>
  <td></td>
</tr>
`).join("");
    // ✅ HTML TEMPLATE (YOUR FULL TEMPLATE HERE)
    const html = `
<html>
<head>
<style>
@page {
  margin: 100px 20px 20px 20px; /* match your PDF margins */
}

.page-border {
  position: fixed;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border: 2px solid #315d7c;
  pointer-events: none;
}
  body { font-family: Arial; padding: 30px; font-size: 14px;}
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed; /* IMPORTANT */
  }

  th, td {
    border: 1px solid #bfc5cc;
    padding: 10px;
    font-size: 14px;
  }

  th {
    text-align: center;
    font-weight: bold;
  }

  .left { text-align: left; }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }

  /* Column widths */
  .col-sr   { width: 8%; }
  .col-part { width: 50%; }  /* 👈 increased */
  .col-qty  { width: 10%; }
  .col-rate { width: 16%; }
  .col-amt  { width: 16%; }

  .footer-section {
  margin-top: 50px;
  font-size: 13px;
}

.signature-row {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
}

.signature-box {
  width: 45%;
  text-align: center;
}

.signature-line {
  height: 170px;
  border: 1px solid #d8d8d8;
  border-radius: 12px;
  margin-bottom: 10px;
}

.regards {
  margin-top: 40px;
}

.note {
  text-align: center;
  margin-top: 20px;
  font-size: 11px;
}

.bottom-banner {
  margin-top: 0px;
}

.bottom-banner img {
  width: 100%;
}
</style>
</head>

<body>
<!-- HEADER -->

<div class="page-border"></div>

<h2 style="text-align:center;">BUSINESS PROPOSAL</h2>
<div style="display: flex;justify-content: space-between;">

<div>
  <b>To:</b><br/>
  ${data.companyName}<br/>
  ${data.address1}<br/>
  ${data.state}, ${data.city} - ${data.pincode}
</div>

<br/>
<div>

<b>Date:</b> ${data.date}<br/>
</div>
</div>
<p>Kind Attn: ${data.contactName}<br/></'p>
<p><b>Subject: Proposal of ${data.businessLine}</b></p>


<table>
  <thead>
    <tr>
    <th class="col-sr">Sr. No.</th>
    <th class="col-part">Particular</th>
    <th class="col-qty">Qty</th>
    <th class="col-rate">Rate</th>
    <th class="col-amt">Amount (Rs.)</th>
    </tr>
  </thead>

  <tbody>
    ${productRows}
    ${emptyRows}
    <tr>
    <td></td>
     <td class="right bold">Discount</td>
    <td></td>
    <td></td>
    <td class="right">${data.discount || 0}</td>
  </tr>

  <tr>
    <td></td>
    <td class="right bold">Gross Total</td>
    <td></td>
    <td></td>
    <td class="right bold">${data.grossTotal || 0}</td>
  </tr>

  <tr>
    <td></td>
    <td class="center">CGST (${data.cgstPercent || 0}%)</td>
    <td></td>
    <td></td>
    <td class="right">${data.cgst || 0}</td>
  </tr>

  <tr>
    <td></td>
    <td class="center">SGST (${data.sgstPercent || 0}%)</td>
    <td></td>
    <td></td>
   <td class="right">${data.sgst || 0}</td>
  </tr>

  <tr>
    <td></td>
    <td class="right">Round off</td>
    <td></td>
    <td></td>
    <td class="right">${data.roundOff || 0}</td>
  </tr>

  <tr>
    <td></td>
      <td class="right bold">Total</td>
    <td></td>
    <td></td>
    <td class="right bold"><b>${data.total || 0}</b></td>
  </tr>

  </tbody>
</table>

<div style="page-break-before: always;">
  ${termsHTML}
</div>
<div style="break-inside: avoid; page-break-inside: avoid; margin-top:30px;">
    <div style="display:flex; justify-content:space-between;">
        <div style="height:50px;">
            <b>For, MS ERPWale Pvt. Ltd.</b>
        </div>
        <div style="text-align:right;height:50px;">
          <b>For, ${data.companyName}<br/>${data.contactName}</b>
        </div>
    </div>

    <div style="margin-top:5px;">
        <b>Regards,</b><br/>
        ${data.userName || ""}<br/>
        ${data.email || ""}<br/>
        ${data.mobile || ""}
    </div>
</div>
</div>

</body>
</html>
`;

    await page.setContent(html, { waitUntil: "load" });


      const pdfBuffer = await page.pdf({
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,

  margin: {
    top: "100px",
    bottom: "100px"
  },

  headerTemplate: `
    <div style="width:95%; text-align:center; margin-left:20px; margin-right:20px">
     <div style="margin-top:5px;">
      <img src="data:image/jpeg;base64,${headerBase64}" style="width:98%; " />
      </div>
    </div>
  `,

  footerTemplate: `
    <div style="width:95%; text-align:center; margin-left:20px; margin-right:20px">
      <div style="margin-top:5px;">
        <img src="data:image/jpeg;base64,${footerBase64}" style="width:98%; " />
      </div>
    </div>
  `
});

 

    return pdfBuffer;

  } finally {
    if (browser) await browser.close();
  }
};

module.exports = generateProposalPDF;