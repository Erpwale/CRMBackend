const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const path = require("path");

router.post("/create", async (req, res) => {
  try {
    const data = req.body;

 const browser = await puppeteer.launch({
  executablePath: "/opt/render/.cache/puppeteer/chrome/linux-*/chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
    const page = await browser.newPage();

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

    // 🔥 CLEAN TERMS FUNCTION (FIXES YOUR ISSUE)
    const cleanTerms = (html) => {
      if (!html) return [];

      let cleaned = html
        .replace(/<span class="ql-ui".*?<\/span>/g, "") // remove quill span
        .replace(/data-list="ordered"/g, "")
        .replace(/datalist="ordered"/g, "");

      // extract li items
      const matches = cleaned.match(/<li[^>]*>(.*?)<\/li>/g) || [];

      return matches.map(item =>
        item
          .replace(/<li[^>]*>/, "")
          .replace(/<\/li>/, "")
          .trim()
      );
    };

    // ✅ HANDLE ARRAY OR STRING INPUT
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
          padding: 40px;
        }

        .header img, .footer img {
          width: 100%;
        }

        .title {
          text-align: center;
          font-weight: bold;
          font-size: 18px;
          margin: 10px 0;
        }

        .right {
          text-align: right;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        table, th, td {
          border: 1px solid black;
        }

        th {
          background: #eee;
        }

        th, td {
          padding: 6px;
          font-size: 12px;
        }

        .summary td {
          text-align: right;
        }

        .terms {
          margin-top: 20px;
        }

        .terms-title {
          font-weight: bold;
          text-decoration: underline;
        }

        .terms ol {
          padding-left: 20px;
        }

        .terms li {
          margin-bottom: 6px;
          line-height: 1.5;
        }
          .signature-container {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
}

.signature-box {
  width: 45%;
  height: 120px;
  border: 2px solid #ccc;
  border-radius: 20px;
  padding: 20px;
  font-size: 14px;
  display: flex;
  align-items: flex-start;
}
      </style>
    </head>

    <body>

      <!-- HEADER -->
      <div class="header">
        <img src="file://${path.join(__dirname, "../assets/header.jpg")}" />
      </div>

      <div class="title">BUSINESS PROPOSAL</div>

      <p class="right"><b>Date:</b> ${data.date}</p>

      <p>
        To,<br/>
        ${data.companyName}<br/>
        ${data.address1}<br/>
        ${data.address2 || ""}<br/>
        ${data.address3 || ""}<br/>
        ${data.state}, ${data.city} - ${data.pincode}
      </p>

      <p><b>Kind Attn :</b> ${data.contactName}</p>
      <p><b>Subject :</b> Proposal of ${data.businessLine}</p>

      <!-- TABLE -->
      <table>
        <tr>
          <th>Sr</th>
          <th>Particular</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount (Rs.)</th>
        </tr>

        ${productRows}

        <tr class="summary">
          <td colspan="4">Discount</td>
          <td>${data.discount}</td>
        </tr>
        <tr class="summary">
          <td colspan="4"><b>Gross Total</b></td>
          <td><b>${data.subtotal}</b></td>
        </tr>
        <tr class="summary">
          <td colspan="4">CGST 9%</td>
          <td>${data.cgst}</td>
        </tr>
        <tr class="summary">
          <td colspan="4">SGST 9%</td>
          <td>${data.sgst}</td>
        </tr>
        <tr class="summary">
          <td colspan="4">Round Off</td>
          <td>${data.roundOff}</td>
        </tr>
        <tr class="summary">
          <td colspan="4"><b>Total</b></td>
          <td><b>${data.total}</b></td>
        </tr>
      </table>

      <!-- TERMS -->
      <div class="terms">
        <p class="terms-title">
          Terms and Condition ${data.businessLine} :
        </p>
          ${termsHTML}  

      
      </div>

      <!-- FOOTER -->
      <br/><br/>
      <table style="width:100%; margin-top:50px;">
  <tr>
    <td style="width:50%; padding-right:10px;">
      <div style="border:2px solid #ccc; border-radius:20px; height:130px; padding:15px;">
        For, MS ERPWale Pvt. Ltd.<br/><br/><br/>
        ___________________<br/>
        Authorized
      </div>
    </td>

    <td style="width:50%; padding-left:10px;">
      <div style="border:2px solid #ccc; border-radius:20px; height:130px; padding:15px;">
        For, ${data.companyName}<br/>
        ${data.contactName}<br/><br/>
        ___________________<br/>
        Authorized Signatory
      </div>
    </td>
  </tr>
</table>
    





      <p style="font-size:10px;">
        (Computer Generated Document so Signature not required)
      </p>

      <div class="footer">
        <img src="file://${path.join(__dirname, "../assets/footer.jpg")}" />
      </div>

    </body>
    </html>
    `;

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=proposal.pdf");

    res.send(pdfBuffer);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "PDF generation failed" });
  }
});

module.exports = router;