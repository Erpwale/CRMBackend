const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");

router.post("/create", async (req, res) => {
  try {
    const data = req.body;

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=proposal.pdf");

    doc.pipe(res);

    // =========================
    // 🧾 HEADER
    // =========================
    doc.fontSize(16).text("ADDON", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(18).text("BUSINESS PROPOSAL", { align: "center" });

    doc.moveDown();
    doc.fontSize(10).text(`Date : ${data.date}`);

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
    doc.fontSize(11).text("------------------------------------------------------------");
    doc.text("Sr | Product | Qty | Rate | Amount");
    doc.text("------------------------------------------------------------");

    // =========================
    // 📦 PRODUCTS
    // =========================
    data.products.forEach((item, index) => {
      doc.text(
        `${index + 1} | ${item.name} | ${item.qty} | ${item.rate} | ${item.totalValue}`
      );
    });

    doc.text("------------------------------------------------------------");

    doc.moveDown();

    // =========================
    // 💰 TOTALS
    // =========================
    doc.text(`Discount : ${data.discount}`);
    doc.text(`Gross Total : ${data.subtotal}`);
    doc.text(`CGST (9%) : ${data.cgst}`);
    doc.text(`SGST (9%) : ${data.sgst}`);
    doc.text(`Round Off : ${data.roundOff}`);
    doc.text(`Total : ${data.total}`);

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