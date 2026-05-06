const Contact = require("../models/Contact");
const SalesOrder = require("../models/SalesOrder");
const Company = require("../models/Company");
const User = require("../models/User");
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

router.post("/get-full-details", async (req, res) => {
  try {
        const { search } = req.body;

    if (!search) {
      return res.status(400).json({
        message: "Mobile or email is required"
      });
    }

    // 1. Find contact using mobile OR email
    const contact = await Contact.findOne({
      $or: [
        { mobile: search },
        { email: search }
      ]
    });

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found"
      });
    }
    // 2. Get Company using companyId
    const company = await Company.findById(contact.companyId);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // 3. Get Sales Orders using companyId
     const salesOrders = await SalesOrder.find({
      companyName: company.companyName
    });
   const user = await User.findById(company.createdBy).select("firstName lastName role email");

    // 4. Return everything
    res.json({
      contact,
      company,
      salesOrders,
      user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

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

const generatePassword = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";

  let password = "";

  for (let i = 0; i < 8; i++) {
    password += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return password;
};

const sendPasswordMail = async (user) => {
  const password = generatePassword();

  const templatePath = path.join(
    __dirname,
    "templates",
    "template.html"
  );

  let htmlTemplate = fs.readFileSync(templatePath, "utf8");

  htmlTemplate = htmlTemplate
    .replace("{{Contact_Name}}", user.firstName)
    .replace("{email}", user.email)
    .replace("XCsn!23A", password);

  await transporter.sendMail({
    from: `"ERPWale Support" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Your Auto Generated Password",
    html: htmlTemplate,
  });

  return password;
};

router.post("/send-password", async (req, res) => {
  try {
    const user = {
      firstName: "Deepali",
      email: "deepalimore609@gmail.com",
    };

    const password = await sendPasswordMail(user);

    res.json({
      success: true,
      password,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Mail sending failed",
    });
  }
});


router.get("/:companyId",  async (req, res) => {
  try {

    const contacts = await Contact.find({
      companyId: req.params.companyId
    }).sort({ _id: -1 }); // 🔥 latest first

    res.json({
      success: true,
      data: contacts
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});


module.exports = router;


