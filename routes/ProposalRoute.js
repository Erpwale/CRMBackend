const express = require("express");
const router = express.Router();
const { chromium } = require("playwright");
const path = require("path");

router.post("/create", async (req, res) => {
  let browser;

  const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
        item
          .replace(/<li[^>]*>/, "")
          .replace(/<\/li>/, "")
          .trim()
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
        body { font-family: Arial; padding: 40px; }
        .header img, .footer img { width: 100%; }
        .title { text-align:center; font-weight:bold; font-size:18px; }
        table { width:100%; border-collapse: collapse; margin-top:10px; }
        table, th, td { border:1px solid black; }
        th { background:#eee; }
        th, td { padding:6px; font-size:12px; }
        .summary td { text-align:right; }
        .terms { margin-top:20px; }
        .signature-box {
          border:2px solid #ccc;
          border-radius:20px;
          height:130px;
          padding:15px;
        }
      </style>
    </head>

    <body>

      <div class="header">
        <img src="file://${path.join(__dirname, "../assets/header.jpg")}" />
      </div>

      <div class="title">BUSINESS PROPOSAL</div>

      <p style="text-align:right;"><b>Date:</b> ${data.date}</p>

      <p>
        To,<br/>
        ${data.companyName}<br/>
        ${data.address1}<br/>
        ${data.state}, ${data.city} - ${data.pincode}
      </p>

      <p><b>Kind Attn :</b> ${data.contactName}</p>
      <p><b>Subject :</b> Proposal of ${data.businessLine}</p>

      <table>
        <tr>
          <th>Sr</th>
          <th>Particular</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>

        ${productRows}

        <tr class="summary">
          <td colspan="4">Total</td>
          <td>${data.total}</td>
        </tr>
      </table>

      <div class="terms">
        <b>Terms:</b>
        ${termsHTML}
      </div>

      <table style="margin-top:50px;">
        <tr>
          <td style="width:50%; padding-right:10px;">
            <div class="signature-box">
              For, MS ERPWale Pvt. Ltd.<br/><br/><br/>
              ___________<br/>
              Authorized
            </div>
          </td>

          <td style="width:50%; padding-left:10px;">
            <div class="signature-box">
              For, ${data.companyName}<br/>
              ${data.contactName}<br/><br/>
              ___________<br/>
              Authorized Signatory
            </div>
          </td>
        </tr>
      </table>

      <div class="footer">
        <img src="file://${path.join(__dirname, "../assets/footer.jpg")}" />
      </div>

    </body>
    </html>
    `;

    // ✅ Load HTML
    await page.setContent(html, { waitUntil: "load" });

    // ✅ Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=proposal.pdf");

    res.send(pdfBuffer);

  } catch (err) {
    console.error(err);
    if (browser) await browser.close();
    res.status(500).json({ message: "PDF generation failed" });
  }
});

module.exports = router;