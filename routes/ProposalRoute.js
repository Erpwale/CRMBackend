const express = require("express");
const router = express.Router();
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const Proposal= require("../models/Proposal")
const { authMiddleware, adminOnly } = require("../middleware/auth");

const headerBase64 = fs.readFileSync(
  path.join(__dirname, "../assets/header.jpg"),
  { encoding: "base64" }
);

const footerBase64 = fs.readFileSync(
  path.join(__dirname, "../assets/footer.jpg"),
  { encoding: "base64" }
);
router.post("/create", async (req, res) => {
  const proposal = new Proposal(req.body);
  await proposal.save();

  res.json({ success: true });
});

router.post("/add",authMiddleware, async (req, res) => {
  try {
    const data = {
  ...req.body,

  uid: req.user._id,
  userName: req.user.name,
  email: req.user.email,
  mobile: req.user.mobile
};
    console.log(req.user);
    
    // 🔒 Basic validation
    if (!data.companyName) {
      return res.status(400).json({ message: "Company name is required" });
    }

    // ✅ Save to DB
    const newProposal = new Proposal(data);
    const savedData = await newProposal.save();
    const companyRoom = data.companyId?.toString(); // make sure companyId exists

   if (global.io) {
  global.io.emit("opportunityUpdated", {
    type: "CREATE",
    data: savedData,
  });
}
    else {
      console.log("❌ Socket not initialized or companyId missing");
    }

    res.status(201).json({
      message: "Proposal saved successfully",
      data: savedData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving data" });
  }
});

router.get("/my-opportunities", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id; // from JWT

    const data = await Proposal.find({ uid: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "User proposals fetched",
      data
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching data" });
  }
});


module.exports = router;