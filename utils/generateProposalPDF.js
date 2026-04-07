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

    const rawTerms = Array.isArray(data.terms)
      ? data.terms.join("")
      : data.terms;

    const termsArray = cleanTerms(rawTerms);

    const termsHTML = `
      <ol>
        ${termsArray.map(t => `<li>${t}</li>`).join("")}
      </ol>
    `;

    // ✅ HTML TEMPLATE (YOUR FULL TEMPLATE HERE)
    const html = `
<html>
<head>
<style>
  body { font-family: Arial; padding: 30px; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 15px; }
  th, td { border: 1px solid #999; padding: 6px; text-align: center; }
  th { background: #f2f2f2; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }
</style>
</head>

<body>
<!-- HEADER -->
<div class="header">
  <img src="data:image/jpeg;base64,${headerBase64}" />
</div>
h

<h2 style="text-align:center;">BUSINESS PROPOSAL</h2>

<div>
  <b>To:</b><br/>
  ${data.companyName}<br/>
  ${data.address1}<br/>
  ${data.address2 || ""}<br/>
  ${data.state}, ${data.city} - ${data.pincode}
</div>

<br/>

<b>Date:</b> ${data.date}<br/>
<b>Contact:</b> ${data.contactName}<br/>
<b>Subject:</b> Proposal of ${data.businessLine}

<table>
<tr>
  <th>Sr</th>
  <th>Particular</th>
  <th>Qty</th>
  <th>Rate</th>
  <th>Amount</th>
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

<tr><td></td><td class="text-right">Discount</td><td></td><td></td><td>${data.discount}</td></tr>
<tr><td></td><td class="text-right">Gross Total</td><td></td><td></td><td>${data.grossTotal}</td></tr>
<tr><td></td><td class="text-right">CGST (${data.cgstPercent}%)</td><td></td><td></td><td>${data.cgst}</td></tr>
<tr><td></td><td class="text-right">SGST (${data.sgstPercent}%)</td><td></td><td></td><td>${data.sgst}</td></tr>
<tr><td></td><td class="text-right">Round Off</td><td></td><td></td><td>${data.roundOff}</td></tr>
<tr><td></td><td class="text-right"><b>Total</b></td><td></td><td></td><td><b>${data.total}</b></td></tr>

</table>

<div style="margin-top:20px;">
  <b>Terms & Conditions</b>
  ${termsHTML}
</div>

</body>
</html>
`;

    await page.setContent(html, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    return pdfBuffer;

  } finally {
    if (browser) await browser.close();
  }
};

module.exports = generateProposalPDF;