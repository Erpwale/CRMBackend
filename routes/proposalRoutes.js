// routes/proposalRoutes.js
const express = require("express");
const router = express.Router();
const Proposal = require("../models/Proposall");
const opp= require("../models/Proposal")
const generateProposalPDF= require("../utils/generateProposalPDF.js")
// ✅ CREATE Proposal
router.post("/create", async (req, res) => {
  try {
    console.log(req.body)
    const { documentTitle, user, mailStatus, businessLine,opid } = req.body;

    const proposal = new Proposal({
      documentTitle,
      user,
      mailStatus,
      businessLine,
      opid
    });

    const saved = await proposal.save();

    res.status(201).json({
      success: true,
      message: "Proposal created",
      data: saved,
    });
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: err.message });
  }
});


// ✅ GET ALL Proposals
router.get("/all", async (req, res) => {
  try {
    const proposals = await Proposal.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: proposals,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ GET SINGLE Proposal
router.get("/:id", async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ success: true, data: proposal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ UPDATE Proposal
router.put("/update/:id", async (req, res) => {
  try {
    const { documentTitle, user, mailStatus } = req.body;

    const updated = await Proposal.findByIdAndUpdate(
      req.params.id,
      { documentTitle, user, mailStatus },
      { new: true }
    );

    res.json({
      success: true,
      message: "Proposal updated",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ DELETE Proposal
router.delete("/delete/:id", async (req, res) => {
  try {
    await Proposal.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Proposal deleted",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/preview", async (req, res) => {
  try {
    const { opid } = req.body;

    const proposal = await opp.findOne({ proposalId: opid });

    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    const pdfBuffer = await generateProposalPDF(proposal);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=proposal.pdf");

    res.send(pdfBuffer);

  } catch (err) {
    console.error("❌ Preview Error:", err);
    res.status(500).json({ message: "Preview failed" });
  }
});

router.post("/send-mail", async (req, res) => {
  try {
    const { to, subject, content, proposalId } = req.body;

    const proposal = await Proposal.findOne({ proposalId });

    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    const pdfBuffer = await generateProposalPDF(proposal);

    await transporter.sendMail({
      to,
      subject,
      html: content,
      attachments: [
        {
          filename: `${proposal.documentTitle}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    res.json({ success: true, message: "Mail sent" });

  } catch (err) {
    console.error("❌ Mail Error:", err);
    res.status(500).json({ message: "Mail failed" });
  }
});

module.exports = router;