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
  <div style="page-break-before: always; margin-top:20px;">

    <h3 style="margin-bottom:10px;">Terms & Conditions</h3>

    ${data.products.map(p => {
      if (!p.terms || p.terms.length === 0) return "";

      return `
        <div style="margin-bottom:12px;">
          <b>${p.name}</b>
          <div style="margin-top:5px;">
            ${Array.isArray(p.terms) ? p.terms.join("") : p.terms}
          </div>
        </div>
      `;
    }).join("")}

    ${data.internalTerms ? `
      <div style="margin-top:15px;">
        <b>Internal Terms</b>
        <div>${data.internalTerms}</div>
      </div>
    ` : ""}

    ${data.specialTerms ? `
      <div style="margin-top:15px;">
        <b>Special Terms</b>
        <div>${data.specialTerms}</div>
      </div>
    ` : ""}

  </div>
`;
console.log("termsHTML:", termsHTML);
const maxRows = 15;

const productRows = data.products.map((p, i) => `
<tr>
  <td>${i + 1}</td>
  <td class="text-left">${p.name || ""}</td>
  <td>${p.qty || ""}</td>
  <td>${p.rate || ""}</td>
  <td class="text-right">${p.totalValue || ""}</td>
</tr>
`).join("");

const emptyRows = Array.from({
  length: Math.max(0, maxRows - data.products.length)
}).map((_, i) => `
<tr>
  <td>${data.products.length + i + 1}</td>
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
  body { font-family: Arial; padding: 30px; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  th, td { border: 1px solid #999; padding: 6px; text-align: center; }
  th { background: #f2f2f2; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }
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
  height: 70px;
  border: 1px solid #ccc;
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



<h2 style="text-align:center;">BUSINESS PROPOSAL</h2>

<div>
  <b>To:</b><br/>
  ${data.companyName}<br/>
  ${data.address1}<br/>
  ${data.state}, ${data.city} - ${data.pincode}
</div>

<br/>

<b>Date:</b> ${data.date}<br/>
<b>Contact:</b> ${data.contactName}<br/>
<b>Subject:</b> Proposal of ${data.businessLine}

<table>
  <thead>
    <tr>
      <th>Sr</th>
      <th>Particular</th>
      <th>Qty</th>
      <th>Rate</th>
      <th>Amount</th>
    </tr>
  </thead>

  <tbody>
    ${productRows}
    ${emptyRows}
    <tr>
    <td></td>
    <td class="text-right">Discount</td>
    <td></td>
    <td></td>
    <td class="text-right">${data.discount || 0}</td>
  </tr>

  <tr>
    <td></td>
    <td class="text-right">Gross Total</td>
    <td></td>
    <td></td>
    <td class="text-right">${data.grossTotal || 0}</td>
  </tr>

  <tr>
    <td></td>
    <td class="text-right">CGST (${data.cgstPercent || 0}%)</td>
    <td></td>
    <td></td>
    <td class="text-right">${data.cgst || 0}</td>
  </tr>

  <tr>
    <td></td>
    <td class="text-right">SGST (${data.sgstPercent || 0}%)</td>
    <td></td>
    <td></td>
    <td class="text-right">${data.sgst || 0}</td>
  </tr>

  <tr>
    <td></td>
    <td class="text-right">Round Off</td>
    <td></td>
    <td></td>
    <td class="text-right">${data.roundOff || 0}</td>
  </tr>

  <tr>
    <td></td>
    <td class="text-right"><b>Total</b></td>
    <td></td>
    <td></td>
    <td class="text-right"><b>${data.total || 0}</b></td>
  </tr>

  </tbody>
</table>

<div style="margin-top:20px;">

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
    bottom: "180px"
  },

  headerTemplate: `
    <div style="width:100%; text-align:center;padding-bottom:200px">
      <img src="data:image/jpeg;base64,${headerBase64}" style="width:100%; margin-bottom:50px" />
    </div>
  `,

  footerTemplate: `
    <div style="width:100%; font-size:10px; padding:0 20px;">

  
      <div style="text-align:center; margin-top:5px;">
        (Computer Generated Document so Signature not required)
      </div>

      <div style="margin-top:5px;">
        <img src="data:image/jpeg;base64,${footerBase64}" style="width:100%;" />
      </div>

      <div style="text-align:right; font-size:9px;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
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