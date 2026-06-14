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
  token: process.env.ZEPTO_TOKEN,
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

    console.log("➡️ Sending mail...", to);

    const proposal = await opp.findOne({ proposalId });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: "Proposal not found",
      });
    }

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

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Ticket Raised Successfully - Tally Support</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@600&amp;family=Inter:wght@400;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                            "on-secondary-fixed": "#121c2a",
                            "tertiary-fixed-dim": "#ffb596",
                            "surface-container": "#eceef0",
                            "outline-variant": "#c3c6d7",
                            "inverse-primary": "#b4c5ff",
                            "tertiary-container": "#bc4800",
                            "error": "#ba1a1a",
                            "on-primary-fixed": "#00174b",
                            "inverse-surface": "#2d3133",
                            "surface": "#f7f9fb",
                            "error-container": "#ffdad6",
                            "on-tertiary-fixed-variant": "#7d2d00",
                            "on-secondary-fixed-variant": "#3d4756",
                            "on-primary": "#ffffff",
                            "secondary-fixed-dim": "#bdc7d9",
                            "surface-dim": "#d8dadc",
                            "on-secondary": "#ffffff",
                            "on-primary-container": "#eeefff",
                            "on-error-container": "#93000a",
                            "surface-container-highest": "#e0e3e5",
                            "primary": "#2563eb", /* adjusted to match requested brand primary */
                            "on-tertiary-container": "#ffede6",
                            "secondary-fixed": "#d9e3f6",
                            "on-primary-fixed-variant": "#003ea8",
                            "on-error": "#ffffff",
                            "surface-tint": "#0053db",
                            "outline": "#737686",
                            "tertiary-fixed": "#ffdbcd",
                            "secondary-container": "#d6e0f3",
                            "primary-fixed": "#dbe1ff",
                            "on-background": "#191c1e",
                            "secondary": "#555f6f",
                            "surface-variant": "#e0e3e5",
                            "surface-container-low": "#f2f4f6",
                            "on-secondary-container": "#596373",
                            "surface-container-lowest": "#ffffff",
                            "on-tertiary-fixed": "#360f00",
                            "on-surface": "#191c1e",
                            "on-tertiary": "#ffffff",
                            "surface-container-high": "#e6e8ea",
                            "on-surface-variant": "#434655",
                            "tertiary": "#943700",
                            "primary-fixed-dim": "#b4c5ff",
                            "primary-container": "#2563eb",
                            "background": "#f7f9fb",
                            "surface-bright": "#f7f9fb",
                            "inverse-on-surface": "#eff1f3"
                    },
                    "borderRadius": {
                            "DEFAULT": "0.25rem",
                            "lg": "0.5rem",
                            "xl": "0.75rem",
                            "full": "9999px"
                    },
                    "spacing": {
                            "unit": "4px",
                            "container-max": "1440px",
                            "margin-desktop": "40px",
                            "gutter": "24px",
                            "margin-mobile": "16px"
                    },
                    "fontFamily": {
                            "label-caps": [
                                    "Geist"
                            ],
                            "headline-lg": [
                                    "Inter"
                            ],
                            "body-sm": [
                                    "Inter"
                            ],
                            "title-md": [
                                    "Inter"
                            ],
                            "headline-lg-mobile": [
                                    "Inter"
                            ],
                            "display-lg": [
                                    "Inter"
                            ],
                            "body-lg": [
                                    "Inter"
                            ]
                    },
                    "fontSize": {
                            "label-caps": [
                                    "12px",
                                    {
                                            "lineHeight": "16px",
                                            "letterSpacing": "0.05em",
                                            "fontWeight": "600"
                                    }
                            ],
                            "headline-lg": [
                                    "32px",
                                    {
                                            "lineHeight": "40px",
                                            "letterSpacing": "-0.01em",
                                            "fontWeight": "600"
                                    }
                            ],
                            "body-sm": [
                                    "14px",
                                    {
                                            "lineHeight": "20px",
                                            "fontWeight": "400"
                                    }
                            ],
                            "title-md": [
                                    "20px",
                                    {
                                            "lineHeight": "28px",
                                            "fontWeight": "600"
                                    }
                            ],
                            "headline-lg-mobile": [
                                    "24px",
                                    {
                                            "lineHeight": "32px",
                                            "fontWeight": "600"
                                    }
                            ],
                            "display-lg": [
                                    "48px",
                                    {
                                            "lineHeight": "56px",
                                            "letterSpacing": "-0.02em",
                                            "fontWeight": "700"
                                    }
                            ],
                            "body-lg": [
                                    "16px",
                                    {
                                            "lineHeight": "24px",
                                            "fontWeight": "400"
                                    }
                            ]
                    }
            },
                },
            }
    </script>
<style>
        .fade-in-up {
            opacity: 0;
            transform: translateY(20px);
            animation: fadeInUp 0.6s ease-out 0.2s forwards;
        }
        
        @keyframes fadeInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }

        .animate-float {
            animation: float 4s ease-in-out infinite;
        }

        .perforated-border-y {
            background-image: linear-gradient(to right, transparent 50%, rgba(195, 198, 215, 0.5) 50%);
            background-size: 20px 2px;
            background-repeat: repeat-x;
        }

        .perforated-border-x {
            background-image: linear-gradient(to bottom, transparent 50%, rgba(195, 198, 215, 0.5) 50%);
            background-size: 2px 20px;
            background-repeat: repeat-y;
        }
    </style>
</head>
<body class="bg-background text-on-surface font-body-lg text-body-lg min-h-screen flex antialiased">
<!-- SideNavBar -->

<!-- Main Content Wrapper -->


<!-- Main Canvas -->
<main class="flex-1 flex flex-col items-center justify-center p-margin-mobile md:p-gutter overflow-y-auto w-full z-10">
<div class="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 pt-4 pb-12">
<!-- Hero Illustration -->
<div class="w-full lg:w-1/3 flex justify-center lg:justify-end fade-in-up" style="animation-delay: 0.1s;">
<img alt="Support Journey Begins" class="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl animate-float mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6lSDqdHdCIpHyN128Dvv0sQOoTf7fdxw8fHDRlRPkNFJLGXom7PMTCf27l_kOgohJuxB1uj7UY4mlIpcR-8ZOtvvcIBsMXPQYBYTinjzT7OZMX6p0FnzbTMQdKL2Mk0OWg5-btLXG3B-fMEPk60ezd4ydMo9bLAOG7-mB0I0-Y4f7fTMFjAh3HuOq-_jAeQaw_ExxjU9j-X18M570zI2xq4h5ZXcm9VFcp4OCKXE2YN0zZtX0YTw2nq4RrOnRI9j8LOi8kSE0Eq0M"/>
</div>
<!-- Boarding Pass Container -->
<div class="w-full lg:w-2/3 flex flex-col items-center fade-in-up" style="animation-delay: 0.3s;">
<div class="text-center lg:text-left w-full mb-6">
<h2 class="font-display-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface mb-2 tracking-tight">Your Support Journey Begins!</h2>
<p class="font-title-md text-title-md text-primary font-semibold">Ticket Confirmed.</p>
</div>
<!-- The Boarding Pass Card -->
<div class="relative bg-surface-container-lowest rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-outline/10 flex flex-col md:flex-row w-full max-w-3xl overflow-hidden group hover:-translate-y-1 hover:shadow-[0_25px_60px_-15px_rgba(37,99,235,0.15)] transition-all duration-500">
<!-- Main Body -->
<div class="flex-1 p-6 md:p-8 flex flex-col justify-between relative">
<!-- Airline/Brand Header -->
<div class="flex justify-between items-start mb-8 pb-6 perforated-border-y bg-bottom bg-no-repeat">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-primary text-[28px]">support_agent</span>
<span class="font-label-caps text-label-caps tracking-widest text-on-surface uppercase font-bold">ERPWale Support Air</span>
</div>
<span class="material-symbols-outlined text-outline/30 text-[32px] transform rotate-45">flight</span>
</div>
<!-- Details Grid -->
<div class="grid grid-cols-2 gap-y-6 gap-x-4 mb-4">
<div>
<span class="block font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Ticket Number</span>
<span class="font-title-md text-[22px] text-primary font-bold">#TLY-8821-250626</span>
</div>
<div>
<span class="block font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Schedule</span>
<span class="font-body-lg text-body-lg text-on-surface font-semibold">Oct 25, 2023 | 10:30 AM</span>
</div>
<div>
<span class="block font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Category</span>
<span class="font-body-lg text-[15px] text-on-surface">Technical Support </span>
</div>
<div>
<span class="block font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Sub-Category</span>
<span class="font-body-lg text-[15px] text-on-surface">Database Latency</span>
</div>
<div class="col-span-2">
<span class="block font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider mb-1">Contact Person</span>
<span class="font-body-lg text-[15px] text-on-surface font-medium">Rajesh Kumar <span class="text-on-surface-variant font-normal ml-1">(+91 98765 43210)</span></span>
</div>
</div>
</div>

<!-- Perforation / Divider (Desktop) -->
<div class="hidden md:flex relative items-center justify-center mx-6">
  <div class="h-full border-l-2 border-dashed border-gray-300"></div>
  <div class="absolute -top-4 w-8 h-8 bg-white rounded-full border border-gray-300 shadow-sm"></div>
  <div class="absolute -bottom-4 w-8 h-8 bg-white rounded-full border border-gray-300 shadow-sm"></div>
</div>
<!-- Perforation / Divider (Mobile) -->
<div class="flex md:hidden relative items-center my-6">
  
  <!-- Horizontal Dashed Line -->
  <div class="w-full border-t-2 border-dashed border-gray-300"></div>

  <!-- Left Circle -->
  <div class="absolute -left-4 w-8 h-8 bg-white rounded-full border border-gray-300 shadow-sm"></div>

  <!-- Right Circle -->
  <div class="absolute -right-4 w-8 h-8 bg-white rounded-full border border-gray-300 shadow-sm"></div>

</div>
<!-- Stub / Barcode Section -->
<div class="w-full md:w-64 bg-surface-container-low/50 p-6 md:p-8 flex flex-col items-center justify-center relative">
<div class="w-full mb-10">
<div class="flex items-center gap-2 mb-2">
<span class="material-symbols-outlined text-primary text-[18px]">smart_toy</span>
<span class="font-label-caps text-[11px] text-on-surface uppercase tracking-wider font-bold">Ticket Routing Insight</span>
</div>
<p class="font-body-sm text-[13px] leading-relaxed text-on-surface-variant">
        Your ticket has been prioritized and routed to our <span class="text-on-surface font-semibold">Technical Specialist</span> based on your category and sub-category selection.
    </p>
</div>
<!-- Simulated Barcode -->
<div class="w-full h-16 flex justify-between items-end gap-[2px] opacity-70">
<div class="w-1 h-full bg-on-surface"></div>
<div class="w-2 h-full bg-on-surface"></div>
<div class="w-1 h-full bg-on-surface"></div>
<div class="w-3 h-full bg-on-surface"></div>
<div class="w-1 h-full bg-on-surface"></div>
<div class="w-2 h-full bg-on-surface"></div>
<div class="w-1 h-full bg-on-surface"></div>
<div class="w-4 h-full bg-on-surface"></div>
<div class="w-1 h-full bg-on-surface"></div>
<div class="w-2 h-full bg-on-surface"></div>
<div class="w-1 h-full bg-on-surface"></div>
<div class="w-2 h-full bg-on-surface"></div>
<div class="w-1 h-full bg-on-surface"></div>
<div class="w-3 h-full bg-on-surface"></div>
<div class="w-1 h-full bg-on-surface"></div>
<div class="w-1 h-full bg-on-surface"></div>
</div>
<div class="font-label-caps text-[10px] mt-2 text-on-surface-variant tracking-widest">#TLY-8821-250626</div>
</div>
</div>
<!-- Action Buttons -->

</div>
</div>
</div>
</main>

</body></html>
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

// if (req.files?.length) {
//   req.files.forEach((file) => {
//     attachments.push({
//       name: file.originalname,
//       content: file.buffer.toString("base64"),
//       mime_type: file.mimetype,
//     });
//   });
// }
const response = await client.sendMail({
  from: {
    address: "noreply@erpwale.com",
    name: "ERPWALE",
  },

  // to: toArray.map((email) => ({
  //   email_address: { address: email },
  // })),
  "to": 
    [
        {
        "email_address": 
            {
                "address": "deepalimore609@gmail.com",
                "name": "ERPWale"
            }
        }
    ],

  cc: ccArray.map((email) => ({
    email_address: { address: email },
  })),

  subject,
  htmlbody: html,
  // attachments,
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