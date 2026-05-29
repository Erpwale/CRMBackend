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

    console.log("VERIFY OTP BODY:", req.body);

    const {
      sessionId,
      otp,
      mobile
    } = req.body;

    // ✅ VALIDATION
    if (!sessionId || !otp || !mobile) {
      return res.status(400).json({
        success: false,
        message:
          "Session ID, OTP and mobile required"
      });
    }

    const apiKey =
      "f9b30f20-4249-11f1-9800-0200cd936042";

    // ✅ VERIFY OTP
    const response = await axios.get(
      `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`
    );

    console.log(
      "2FACTOR VERIFY RESPONSE:",
      response.data
    );

    // ✅ OTP VERIFIED
    if (response.data.Status === "Success") {

      // ✅ FIND CONTACT
      const contact = await Contact.findOne({
        mobile
      });

      console.log("FOUND CONTACT:", contact);

      // ❌ CONTACT NOT FOUND
      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Contact not found"
        });
      }

      // ✅ CREATE JWT TOKEN
      const token = jwt.sign(
        {
          id: contact._id,
          type: "customer",
           companyId: contact.companyId,
           termsAccepted: contact.termsAccepted || false
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "30d"
        }
      );

      console.log("GENERATED TOKEN:", token);

      // ✅ FINAL RESPONSE
      return res.status(200).json({
        success: true,
        message: "OTP verified successfully",

        token,

        contact
      });
    }

    // ❌ INVALID OTP
    return res.status(400).json({
      success: false,
      message: "Invalid OTP"
    });

  } catch (error) {

    console.log("VERIFY OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "OTP verification failed"
    });
  }
});



module.exports = router;