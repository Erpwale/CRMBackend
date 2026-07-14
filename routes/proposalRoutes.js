// routes/proposalRoutes.js
const express = require("express");
const router = express.Router();
const Proposal = require("../models/Proposall");
const opp= require("../models/Proposal")
const generateProposalPDF= require("../utils/generateProposalPDF.js")
const nodemailer = require("nodemailer");
const dns = require("dns");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const { SendMailClient } = require("zeptomail");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
});
const client = new SendMailClient({
  url: "https://api.zeptomail.in/v1.1/email",
  token: process.env.ZEPTO_TOKEN_PROPOSEL,
});

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
     const updatedOpportunity =
await opp.findOneAndUpdate(
  { proposalId: opid },  // 👈 match your number field
  { proposalStatus: true }
);

 if (global.io) {
      global.io.emit("ProposelUpdated", {
        type: "CREATE",
        data: updatedOpportunity,
        new: true
      });
    } else {
      console.log("❌ Socket not initialized or companyId missing");
    }

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

router.post(
  "/send-mail",
  upload.array("attachments"),
  async (req, res) => {
  try {
      console.log("BODY RECEIVED:", req.body);
  console.log("CONTENT TYPE:", req.headers["content-type"]);
    const { to, cc, subject, content, proposalId } = req.body;


    const proposal = await opp.findOne({ proposalId });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }
const defaultSubject = `Proposal Sending`;

const finalSubject =
  subject && subject.trim()
    ? subject
    : defaultSubject;
    console.log("➡️ Sending mail...", finalSubject);
    const pdfLink = `https://crmbackend-ozmq.onrender.com/api/Proposel/proposal/${proposalId}`;

    // Convert TO emails
    const toArray =
      typeof to === "string"
        ? to.split(",").map((e) => e.trim()).filter(Boolean)
        : Array.isArray(to)
        ? to
        : [];

    // Convert CC emails
    const ccArray =
      typeof cc === "string"
        ? cc.split(",").map((e) => e.trim()).filter(Boolean)
        : Array.isArray(cc)
        ? cc
        : [];

    const html = `
      <!DOCTYPE html>


<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ERPWALE Support Ticket</title>
</head>

<body style="margin:0;padding:0;background:#f7f9fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f9fb;">
<tr>
<td align="center" style="padding:30px 15px;">

<table width="800" cellpadding="0" cellspacing="0" border="0"
style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;">

<tr>
<td align="center" style="padding:30px 20px;">

<img
src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6lSDqdHdCIpHyN128Dvv0sQOoTf7fdxw8fHDRlRPkNFJLGXom7PMTCf27l_kOgohJuxB1uj7UY4mlIpcR-8ZOtvvcIBsMXPQYBYTinjzT7OZMX6p0FnzbTMQdKL2Mk0OWg5-btLXG3B-fMEPk60ezd4ydMo9bLAOG7-mB0I0-Y4f7fTMFjAh3HuOq-_jAeQaw_ExxjU9j-X18M570zI2xq4h5ZXcm9VFcp4OCKXE2YN0zZtX0YTw2nq4RrOnRI9j8LOi8kSE0Eq0M"
width="220"
style="display:block;border:none;max-width:220px;"
alt="Support Journey Begins">

<h2 style="margin:25px 0 10px;color:#111827;font-size:32px;">
Your Support Journey Begins!
</h2>

<p style="margin:0;color:#326808;font-size:20px;font-weight:bold;">
Ticket Confirmed
</p>

</td>
</tr>

<tr>
<td style="padding:0 30px 30px 30px;">

<table width="100%" cellpadding="0" cellspacing="0" border="0"
style="
background:#ffffff;
border:1px solid #d1d5db;
border-radius:16px;
">

<tr>

<td width="70%"
valign="top"
style="padding:30px;">

<table width="100%" cellpadding="0" cellspacing="0">

<tr>
<td>
<span style="
color:#2563eb;
font-size:22px;
font-weight:bold;
">
☎ ERPWALE SUPPORT AIR
</span>
</td>
</tr>

<tr>
<td style="
padding-top:15px;
border-bottom:1px dashed #cbd5e1;
">
&nbsp;
</td>
</tr>

</table>

<br>

<table width="100%" cellpadding="8" cellspacing="0">

<tr>
<td width="50%">
<div style="font-size:11px;color:#6b7280;">
TICKET NUMBER
</div>

<div style="
font-size:22px;
font-weight:bold;
color:#2563eb;
">
#TLY-8821-250626
</div>
</td>

<td width="50%">
<div style="font-size:11px;color:#6b7280;">
SCHEDULE
</div>

<div style="
font-size:15px;
font-weight:bold;
color:#111827;
">
Oct 25, 2023 | 10:30 AM
</div>
</td>
</tr>

<tr>
<td>
<div style="font-size:11px;color:#6b7280;">
CATEGORY
</div>

<div style="font-size:15px;color:#111827;">
Technical Support
</div>
</td>

<td>
<div style="font-size:11px;color:#6b7280;">
SUB CATEGORY
</div>

<div style="font-size:15px;color:#111827;">
Database Latency
</div>
</td>
</tr>

<tr>
<td colspan="2">
<div style="font-size:11px;color:#6b7280;">
CONTACT PERSON
</div>

<div style="
font-size:15px;
font-weight:bold;
color:#111827;
">
Rajesh Kumar
<span style="font-weight:normal;">
(+91 9876543210)
</span>
</div>
</td>
</tr>

</table>

</td>

<td width="30%"
valign="top"
style="
padding:30px;
border-left:2px dashed #d1d5db;
background:#f8fafc;
">

<div style="
font-size:12px;
font-weight:bold;
color:#2563eb;
margin-bottom:10px;
">
🤖 TICKET ROUTING INSIGHT
</div>

<p style="
font-size:13px;
line-height:22px;
color:#4b5563;
margin:0;
">
Your ticket has been prioritized and routed to our
<strong>Technical Specialist</strong>
based on your category and sub-category selection.
</p>

<br><br>

<!-- <div style="
font-family:monospace;
font-size:18px;
letter-spacing:3px;
text-align:center;
color:#111827;
">
|||| ||| |||| || |||| |||
</div>

<div style="
font-size:11px;
letter-spacing:2px;
text-align:center;
margin-top:10px;
color:#6b7280;
">
#TLY-8821-250626
</div> -->

</td>

</tr>

</table>

</td>
</tr>

<tr>
<td align="center" style="padding:20px;">

<a href="{{PDF_LINK}}"
style="
background:#2563eb;
color:#ffffff;
text-decoration:none;
padding:12px 24px;
border-radius:6px;
display:inline-block;
font-weight:bold;
">
View Proposal
</a>

</td>
</tr>

<tr>
<td style="
background:#f3f4f6;
padding:20px;
text-align:center;
font-size:12px;
color:#6b7280;
">

ERPWALE Support Team<br>
support@erpwale.com

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>



    `;

    try {
const pdfResponse = await fetch(pdfLink);

if (!pdfResponse.ok) {
  throw new Error("Failed to fetch PDF");
}

const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
 const attachments = [
  {
    name: `Proposal-${proposalId}.pdf`,
    content: pdfBuffer.toString("base64"),
    mime_type: "application/pdf",
  },
];

if (req.files?.length) {
  req.files.forEach((file) => {
    attachments.push({
      name: file.originalname,
      content: file.buffer.toString("base64"),
      mime_type: file.mimetype,
    });
  });
}
const response = await client.sendMail({
  from: {
   address: "support@erpwale.com",
    name: "Support-ERPWALE ",
  },

  to: toArray.map((email) => ({
    email_address: { address: email },
  })),
  // "to": 
  //   [
  //       {
  //       "email_address": 
  //           {
  //               "address": "deepalimore609@gmail.com",
  //               "name": "ERPWale"
  //           }
  //       }
  //   ],

  cc: ccArray.map((email) => ({
    email_address: { address: email },
  })),

    subject: finalSubject,
  htmlbody: html,
  attachments,
});

      console.log("✅ Mail Sent:", response);

      // Update status = Sent
      await fetch(
        "https://crmbackend-j0pp.onrender.com/api/Proposel/update-mail-status",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            proposalId,
            status: "Sent",
          }),
        }
      );

      return res.json({
        success: true,
        message: "Mail sent successfully",
      });

    } catch (mailErr) {
      console.error("❌ ZeptoMail Error:", JSON.stringify(mailErr, null, 2));
      

      // Update status = Failed
      await fetch(
        "https://crmbackend-j0pp.onrender.com/api/Proposel/update-mail-status",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            proposalId,
            status: "Failed",
          }),
        }
      );

      return res.status(500).json({
        success: false,
        message: "Mail failed",
        error: mailErr.message,
      });
    }

  } catch (err) {
    console.error("❌ Route Error:", err);

    return res.status(500).json({
      success: false,
      message: "Mail failed",
      error: err.message,
    });
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