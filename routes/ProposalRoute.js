const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const path = require("path");
const parseHTML = (html) => {
  if (!html) return [];

  const paragraphs = html.split(/<\/p>/g);

  return paragraphs
    .map(p => p.replace(/<p>/g, "").trim())
    .filter(p => p)
    .map(p => {
      const parts = [];

      // split bold and normal text
      const regex = /<b>(.*?)<\/b>/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(p)) !== null) {
        // normal text before bold
        if (match.index > lastIndex) {
          parts.push({
            text: p.slice(lastIndex, match.index),
            bold: false,
          });
        }

        // bold text
        parts.push({
          text: match[1],
          bold: true,
        });

        lastIndex = regex.lastIndex;
      }

      // remaining normal text
      if (lastIndex < p.length) {
        parts.push({
          text: p.slice(lastIndex),
          bold: false,
        });
      }

      return parts;
    });
};
const addHeaderFooter = (doc) => {
  const headerPath = path.join(__dirname, "../assets/header.jpg");
  const footerPath = path.join(__dirname, "../assets/footer.jpg");

  // Header Image
  doc.image(headerPath, 0, 0, {
    width: doc.page.width,
  });

  // Footer Image
  doc.image(
    footerPath,
    0,
    doc.page.height - 80, // adjust height
    { width: doc.page.width }
  );
};
router.post("/create", async (req, res) => {
  try {
    const data = req.body;
    console.log(data);
    
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=proposal.pdf");

  doc.pipe(res);

addHeaderFooter(doc);

doc.on("pageAdded", () => {
  addHeaderFooter(doc);
});

// Now your content
doc.moveDown(5);

doc.fontSize(16).text("BUSINESS PROPOSAL", { align: "center" });

   doc.fontSize(10).text(`Date : ${data.date}`, {
  align: "right",
});

    doc.moveDown();

    doc.text(`To,`);
    doc.text(data.companyName);
    doc.text(data.address1);
    doc.text(data.address2);
    doc.text(data.address3);
    doc.text(`${data.state}, ${data.city}, ${data.pincode}`);

    doc.moveDown();

    doc.text(`Kind Attn : ${data.contactName}`);
    doc.text(`Subject : Proposal of ${data.businessLine}`);

    doc.moveDown();

    // =========================
    // 📦 TABLE HEADER
    // =========================
   const tableTop = doc.y + 10;

const col1 = 40;   // Sr No
const col2 = 80;   // Product
const col3 = 300;  // Qty
const col4 = 360;  // Rate
const col5 = 430;  // Amount
const tableWidth = 500;

// Header Row
doc
  .rect(40, tableTop, 500, 25)
  .stroke();
// Vertical column lines (HEADER)
doc.moveTo(col2 - 10, tableTop)
   .lineTo(col2 - 10, tableTop + 25)
   .stroke();

doc.moveTo(col3 - 10, tableTop)
   .lineTo(col3 - 10, tableTop + 25)
   .stroke();

doc.moveTo(col4 - 10, tableTop)
   .lineTo(col4 - 10, tableTop + 25)
   .stroke();

doc.moveTo(col5 - 10, tableTop)
   .lineTo(col5 - 10, tableTop + 25)
   .stroke();

doc.text("Sr.", col1, tableTop + 8);
doc.text("Particular", col2, tableTop + 8);
doc.text("Qty", col3, tableTop + 8);
doc.text("Rate", col4, tableTop + 8);
doc.text("Amount (Rs.)", col5, tableTop + 8);

    // =========================
    // 📦 PRODUCTS
    // =========================
   let y = tableTop + 25;

data.products.forEach((item, index) => {
  doc.rect(40, y, 500, 25).stroke();

  // 🔥 COLUMN LINES
  doc.moveTo(col2 - 10, y).lineTo(col2 - 10, y + 25).stroke();
  doc.moveTo(col3 - 10, y).lineTo(col3 - 10, y + 25).stroke();
  doc.moveTo(col4 - 10, y).lineTo(col4 - 10, y + 25).stroke();
  doc.moveTo(col5 - 10, y).lineTo(col5 - 10, y + 25).stroke();

  // Text
  doc.text(index + 1, col1, y + 8);
  doc.text(item.name, col2, y + 8);
  doc.text(item.qty, col3, y + 8);
  doc.text(item.rate, col4, y + 8);
  doc.text(item.totalValue, col5, y + 8);

  y += 25;
});
  

    doc.moveDown();

    // =========================
    // 💰 TOTALS
  const drawSummary = (label, value, bold = false) => {
  doc.rect(40, y, tableWidth, 25).stroke();

  // vertical line only before amount column
  doc.moveTo(col5 - 10, y).lineTo(col5 - 10, y + 25).stroke();

  if (bold) doc.font("Helvetica-Bold");
  else doc.font("Helvetica");

  // label in merged area
  doc.text(label, col3 - 20, y + 8);

  // value right aligned
  doc.text(value, col5, y + 8, {
    width: 80,
    align: "right",
  });

  y += 25;
};

// Discount
drawSummary("Discount", data.discount);
drawSummary("Gross Total", data.subtotal, true);
drawSummary("CGST 9%", data.cgst);
drawSummary("SGST 9%", data.sgst);
drawSummary("Round Off", data.roundOff);
drawSummary("Total", data.total, true);
    doc.moveDown();

    // =========================
    // 📜 TERMS
    // =========================
doc.x = 40;

doc
  .font("Helvetica-Bold")
  .text(`Terms and Condition ${data.businessLine} :`, {
    underline: true
  });

    doc.moveDown();

    doc.moveDown();

doc
  .font("Helvetica-Bold")
  .text(`Terms and Condition ${data.businessLine} :`, 40, doc.y, {
    underline: true,
  });

doc.moveDown(0.5);

const parsedTerms = parseHTML(data.terms.join(" "));

parsedTerms.forEach((paragraph, index) => {
  doc.x = 40;

  // numbering
  doc.font("Helvetica").text(`${index + 1}. `, {
    continued: true,
  });

  paragraph.forEach((part, i) => {
    doc
      .font(part.bold ? "Helvetica-Bold" : "Helvetica")
      .text(part.text, {
        continued: i !== paragraph.length - 1,
      });
  });

  doc.moveDown(0.3);
});
    doc.moveDown(2);

    // =========================
    // ✍️ FOOTER
    // =========================
    doc.text(`For, ${data.companyName}, ${data.contactName}`);
    doc.text(`For, MS ERPWale Pvt. Ltd.`);

    doc.moveDown(2);

    doc.text("Regards,");
    doc.text(data.userName);
    doc.text(data.email);
    doc.text(data.mobile);

    doc.moveDown();

    doc.fontSize(9).text(
      "(Computer Generated Document so Signature not required)"
    );

    doc.end();
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "PDF generation failed" });
  }
});

module.exports = router;