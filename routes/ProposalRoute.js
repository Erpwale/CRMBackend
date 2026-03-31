const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const path = require("path");

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
    // =========================
  const drawRow = (label, value, bold = false) => {
  doc.rect(40, y, 500, 25).stroke();

  if (bold) doc.font("Helvetica-Bold");

  doc.text(label, col4 - 60, y + 8);
  doc.text(value, col5, y + 8);

  doc.font("Helvetica"); // reset
  y += 25;
};

// Discount
drawRow("Discount", data.discount);

// Gross Total
drawRow("Gross Total", data.subtotal, true);

// CGST
drawRow("CGST 9%", data.cgst);

// SGST
drawRow("SGST 9%", data.sgst);

// Round Off
drawRow("Round Off", data.roundOff);

// Total
drawRow("Total", data.total, true);

    doc.moveDown();

    // =========================
    // 📜 TERMS
    // =========================
    doc.text(
      `Terms and Condition ${data.businessLine} Delivery : Immediate/Online/Soft License. Taxes : GST as applicable.`
    );

    doc.moveDown();

    data.terms?.forEach((t) => {
      doc.text(t);
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