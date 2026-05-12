const express = require("express");
const axios = require("axios");
const Contact = require("../models/Contact");
const jwt = require("jsonwebtoken");
const router = express.Router();

router.post("/send-otp", async (req, res) => {
  try {
   

    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number required"
      });
    }

    // ✅ CHECK CONTACT EXISTS
    const contact = await Contact.findOne({
      mobile
    });

    // ❌ CONTACT NOT FOUND
    if (!contact) {
      return res.status(404).json({
        success: false,
        message:
          "Contact not found. Please contact support."
      });
    }

    const apiKey =
      "f9b30f20-4249-11f1-9800-0200cd936042";

    const response = await axios.get(
      `https://2factor.in/API/V1/${apiKey}/SMS/+91${mobile}/AUTOGEN3/SupportPortal`
    );

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: response.data
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to send OTP"
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { sessionId, otp } = req.body;

    if (!sessionId || !otp) {
      return res.status(400).json({
        success: false,
        message: "Session ID and OTP required"
      });
    }

    const apiKey =
      "f9b30f20-4249-11f1-9800-0200cd936042";

    const response = await axios.get(
      `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`
    );

    // ✅ OTP verified
    if (response.data.Status === "Success") {

      // create jwt here
      // const token = jwt.sign(...)

      return res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        data: response.data
      });
    }
  // ✅ CREATE JWT TOKEN
      const token = jwt.sign(
        {
          id: customer._id
        },
        process.env.JWT_SECRET
      );

    return res.status(400).json({
      success: false,
      message: "Invalid OTP"
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "OTP verification failed"
    });
  }
});

module.exports = router;