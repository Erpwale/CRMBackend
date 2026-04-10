// routes/proposalRoutes.js
const express = require("express");
const router = express.Router();
const Proposal = require("../models/Proposall");
const opp= require("../models/Proposal")
const generateProposalPDF= require("../utils/generateProposalPDF.js")
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  pool: true, // Enable connection pooling
  maxConnections: 5, // Maximum number of simultaneous connections (default: 5)
  maxMessages: 100, // Messages per connection before reconnecting (default: 100)
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // optional but helps in some servers
  },
});
module.exports = transporter;
// ✅ CREATE Proposal
const companyRoom = companyId.toString();
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

router.get("/proposal/:opid", async (req, res) => {
  try {
    const { opid } = req.params;

    const proposal = await opp.findOne({ proposalId: opid });

    if (!proposal) {
      return res.status(404).send("Proposal not found");
    }

    const pdfBuffer = await generateProposalPDF(proposal);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=proposal_${opid}.pdf`
    );

    res.send(pdfBuffer);
  } catch (err) {
    console.error("❌ Preview Error:", err);
    res.status(500).send("Preview failed");
  }
});

// router.post("/send-mail", async (req, res) => {
//   try {
//     const { to, subject, content, proposalId } = req.body;

//     console.log("➡️ Sending mail...");
//     console.log("TO:", to);
//     console.log("EMAIL:", process.env.EMAIL);

//     // ❌ removed verify

//     const proposal = await opp.findOne({ proposalId });

//     if (!proposal) {
//       return res.status(404).json({ message: "Proposal not found" });
//     }

//     const pdfBuffer = await generateProposalPDF(proposal);
//     console.log("📄 PDF SIZE:", pdfBuffer.length);

//     await transporter.sendMail({
//       from: process.env.EMAIL, // ✅ ADD THIS
//       to,
//       subject,
//       html: content,
//       attachments: [
//         {
//           filename: `${proposal.documentTitle}.pdf`,
//           content: pdfBuffer,
//           contentType: "application/pdf",
//         },
//       ],
//     });

//     console.log("✅ MAIL SENT");

//     res.json({ success: true });

//   } catch (err) {
//     console.error("❌ Mail Error:", err);
//     res.status(500).json({ message: "Mail failed" });
//   }
// });

router.post("/send-mail", async (req, res) => {
  try {
    const { to, subject, content, proposalId } = req.body;
    

    console.log("➡️ Sending mail...",to);

    const proposal = await opp.findOne({ proposalId });

    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    // ✅ Correct link
    const pdfLink = `https://crmbackend-j0pp.onrender.com/proposal/${proposalId}`;
console.log("EMAIL:", process.env.EMAIL);



    try {
      await transporter.sendMail({
        from: process.env.EMAIL,
        replyTo: proposal.email, // ⚠️ fix typo (, → .)
        to,
        subject,
        html: `
          ${content}
          <br/><br/>
          👉 <a href="${pdfLink}" target="_blank">View Proposal</a>
        `,
      });

      console.log("✅ MAIL SENT");

await fetch("https://crmbackend-j0pp.onrender.com/api/Proposel/update-mail-status", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    proposalId,
    status: "Sent",
  }),
});

      res.json({ success: true });

    } catch (mailErr) {
      console.error("❌ Mail Error:", mailErr);

   await fetch("https://crmbackend-j0pp.onrender.com/api/Proposel/update-mail-status", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    proposalId,
    status: "Failed",
  }),
});
      res.status(500).json({ message: "Mail failed" });
    }


  } catch (err) {
    console.error("❌ Mail Error:", err);
    res.status(500).json({ message: "Mail failed" });
  }
});

router.put("/update-mail-status", async (req, res) => {
  try {
    console.log("Update staus",req.body)
    const { proposalId, status } = req.body;
    console.log("RAW proposalId:", proposalId);
console.log("TYPE:", typeof proposalId);

const num = Number(proposalId);
console.log("Converted:", num);

    if (!["Sent", "Pending", "Failed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
      console.log("invalid Status")
    }


    const proposal = await Proposal.findOneAndUpdate(
      { opid:proposalId },
      { $set: { mailStatus: status } },
       { returnDocument: "after" }
    );
    console.log(proposal)
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }
 if (global.io) {
      console.log("📡 Emitting proUpdated (UPDATE) to:", companyRoom);

      global.io.to(companyRoom).emit("proUpdated", {
        type: "UPDATE",
        data: proposal,
      });
    }

    res.json({
      success: true,
      mailStatus: proposal.mailStatus,
    });

  } catch (err) {
    console.error("❌ Status Update Error:", err);
    res.status(500).json({ message: "Update failed" });
  }
});
module.exports = router;