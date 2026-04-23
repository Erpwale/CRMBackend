// routes/proposalRoutes.js
const express = require("express");
const router = express.Router();
const Proposal = require("../models/Proposall");
const opp= require("../models/Proposal")
const generateProposalPDF= require("../utils/generateProposalPDF.js")
const nodemailer = require("nodemailer");
const dns = require("dns");
const { authMiddleware, adminOnly } = require("../middleware/auth");
dns.setDefaultResultOrder("ipv4first");
const transporter = nodemailer.createTransport({
host: "smtp.hostinger.com",
  port: 587,
  secure: false,
  requireTLS:true,
  pool: true, // Enable connection pooling
  maxConnections: 5, // Maximum number of simultaneous connections (default: 5)
  maxMessages: 100, // Messages per connection before reconnecting (default: 100)
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
  logger: true,
  debug: true
});
module.exports = transporter;
// ✅ CREATE Proposal
// const companyRoom = companyId.toString();
router.post("/create", authMiddleware, async (req, res) => {
  try {
    console.log(req.body);

    const { documentTitle, mailStatus, businessLine, opid ,user,companyId} = req.body;

    const proposal = new Proposal({
      documentTitle,
      businessLine,
      mailStatus,
      opid,
      user,
      uid: req.user._id,   // ✅ THIS is the only change you need
      companyId: companyId  // ✅ ADD THIS
    });

    const saved = await proposal.save();
 // ✅ 🔥 UPDATE OPPORTUNITY HERE
 await opp.findOneAndUpdate(
  { proposalId: opid },  // 👈 match your number field
  { proposalStatus: true }
);
    res.status(201).json({
      success: true,
      message: "Proposal created",
      data: saved,
    });
 

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});


// ✅ GET ALL Proposals
router.get("/allAdmin", async (req, res) => {
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


router.get("/all", authMiddleware, async (req, res) => {
  try {
    const { companyId } = req.query;

    // ❌ If not provided → throw error
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "companyId is required",
      });
    }

    const query = {
      uid: req.user._id,
      companyId: companyId, // ✅ always applied
    };

    const proposals = await Proposal.find(query)
      .populate("uid", "name email")
      .sort({ createdAt: -1 });

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

    // ✅ use dynamic name
    const fileName = `${proposal.companyName || "proposal"}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${fileName}"`
    );

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
 // ✅ business line + opid
    const safeBusinessLine = (proposal.businessLine || "proposal")
      .replace(/[^a-z0-9]/gi, "_");

    const fileName = `${safeBusinessLine}-${opid}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${fileName}"`
    );

    res.send(pdfBuffer);
  } catch (err) {
    console.error("❌ Preview Error:", err);
    res.status(500).send("Preview failed");
  }
});
router.get("/proposal/title/:documentTitle", async (req, res) => {
  try {
    const { documentTitle } = req.params;

  const proposal = await Proposal.findOne({
  documentTitle: { $regex: `^${documentTitle}$`, $options: "i" }
}); 

    if (!proposal) {
      return res.status(404).send("Proposal not found");
    }

    const pdfBuffer = await generateProposalPDF(proposal);

    // ✅ Safe business line
    const safeBusinessLine = (proposal.businessLine || "proposal")
      .replace(/[^a-z0-9]/gi, "_");

    // ✅ Use documentTitle instead of opid
    const safeTitle = documentTitle.replace(/[^a-z0-9]/gi, "_");

    const fileName = `${safeBusinessLine}-${safeTitle}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${fileName}"`
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
    const { to, cc, subject, content, proposalId } = req.body;

    console.log("➡️ Sending mail...", to);

    const proposal = await opp.findOne({ proposalId });

    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    const pdfLink = `https://crmbackend-ozmq.onrender.com/api/Proposel/proposal/${proposalId}`;

    // ✅ CONVERT STRING → ARRAY
    const toArray = typeof to === "string"
      ? to.split(",").map(e => e.trim()).filter(Boolean)
      : Array.isArray(to) ? to : [];

    const ccArray = typeof cc === "string"
      ? cc.split(",").map(e => e.trim()).filter(Boolean)
      : Array.isArray(cc) ? cc : [];

    try {
      await transporter.sendMail({
        from: `"ERPWALE" <${process.env.EMAIL}>`,
        replyTo: proposal.email,

        // ✅ JOIN BACK
        to: toArray.join(","),

        // ✅ OPTIONAL
        cc: ccArray.length ? ccArray.join(",") : undefined,

        subject,

        // ✅ ADD TEXT VERSION (reduces spam)
        text: content.replace(/<[^>]+>/g, ""),

        html: `
          <p>Hello,</p>
          <p>${content}</p>
          <p>
            <a href="${pdfLink}" target="_blank">
              View Proposal
            </a>
          </p>
          <br/>
          <p>Regards,<br/>Your Company</p>
        `,
      });

      console.log("✅ MAIL SENT");

      await fetch("https://crmbackend-j0pp.onrender.com/api/Proposel/update-mail-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
//  if (global.io) {
//       console.log("📡 Emitting proUpdated (UPDATE) to:", companyRoom);

//       global.io.to(companyRoom).emit("proUpdated", {
//         type: "UPDATE",
//         data: proposal,
//       });
//     }

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