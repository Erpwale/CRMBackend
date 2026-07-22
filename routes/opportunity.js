// routes/deal.js
const express = require("express");
const router = express.Router();
const Deal = require("../models/opportunityModel.js");
const SalesOrder=require("../models/SalesOrder")
const upload = require("../middleware/Smallcustmization.js");
const logActivity = require("../utils/Activitylog");
const { authMiddleware } = require("../middleware/auth");
// ➕ CREATE DEAL
router.post("/add", authMiddleware, upload.array("attachments"), async (req, res) => {  try {
    console.log("inside it");
    
    if (req.body.businessLine === "Annual Support Cover") {
      const licenseNo =
        req.body.products?.[0]?.amcDetails?.licenseNo;

      if (licenseNo) {
        const existingAMC = await SalesOrder.findOne({
          businessLine: "Annual Support Cover",
          "products.amcDetails.licenseNo": licenseNo,
          isBill: true,
          isOutstanding: false,
        });

        if (existingAMC) {
          return res.status(400).json({
            success: false,
            message: `Annual Support Cover already exists for License No ${licenseNo}`,
          });
        }
      }
    }
const attachmentData = JSON.parse(
      req.body.attachmentData || "[]"
    );

    body.attachments = [];

    if (req.files && req.files.length > 0) {
      body.attachments = req.files.map((file, index) => ({
        title: attachmentData[index]?.title || "",
        fileName: file.originalname,
        filePath: file.path.replace(/\\/g, "/"),
        fileType: file.mimetype,
        fileSize: file.size,
      }));
    }

    const deal = new Deal(req.body);
    await deal.save();
await logActivity({
  req,
  userId: req.user.id,
  module: "OPPORTUNITY",
  action: "CREATE",
  description: `Created opportunity ${deal.opportunityName || deal.companyName}`,
  recordId: deal._id,
  recordName: deal.opportunityName || deal.companyName,
});
    res.status(201).json({
      success: true,
      message: "Opportunity created successfully",
      data: deal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error creating deal",
    });
  }
});

// ✏️ UPDATE DEAL
router.put("/:id", authMiddleware, async (req, res) => {
    try {
    const updated = await Deal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    await logActivity({
  req,
  userId: req.user.id,
  module: "OPPORTUNITY",
  action: "UPDATE",
  description: `Updated opportunity ${updated.opportunityName || updated.companyName}`,
  recordId: updated._id,
  recordName: updated.opportunityName || updated.companyName,
});

    res.json({
      message: "Opportunity updated",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

// 📄 GET ALL
router.get("/", async (req, res) => {
  try {
    const deals = await Deal.find().sort({ createdAt: -1 });
    res.json(deals);
  } catch (err) {
    res.status(500).json({ message: "Fetch error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    res.json(deal);
  } catch (err) {
    res.status(500).json({ message: "Error fetching deal" });
  }
});
module.exports = router; // ✅ THIS WAS MISSING