const express = require("express");
const Company = require("../models/Company");
const { authMiddleware, adminOnly } = require("../middleware/auth");

const router = express.Router();


// CREATE COMPANY
router.post("/create-company", authMiddleware, async (req, res) => {
  try {
    console.log(req.body);
    
    const {
      companyName,
      source,
      companyType,
      businessLine,
      businessType,
      noOfLocation,
      noOfEmployee,
      noOfTallyUser,
      turnover,
      address,
      primaryContact,
      tallyLicense,
      remark
    } = req.body;

    // Required fields validation
    if (
      !companyName ||
      !source ||
      !companyType ||
      !businessLine ||
      !businessType ||
      !noOfEmployee ||
      !noOfTallyUser ||
      !turnover ||
      !address?.line1 ||
      !address?.city ||
      !address?.state ||
      !address?.pincode ||
      !primaryContact?.name ||
      !primaryContact?.contactNumber ||
      !primaryContact?.contactEmail ||
      !primaryContact?.designation ||
      !tallyLicense ||
      !remark
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    // Check unique contact number
    const existingNumber = await Company.findOne({
      "primaryContact.contactNumber": primaryContact.contactNumber
    });
    const existingCompany = await Company.findOne({
      "companyName": companyName
    });

    if (existingNumber) {
      return res.status(400).json({
        message: `Contact number already exists. Company: ${existingNumber.companyName} created by ${existingNumber.createdBy?.name}`
      });
    }
    if (existingCompany) {
      return res.status(400).json({
        message: `Company name already exists Company: ${existingNumber.companyName} created by ${existingNumber.createdBy?.name}`
      });
    }

    // Check unique email
    const existingEmail = await Company.findOne({
      "primaryContact.contactEmail": primaryContact.contactEmail
    });

    if (existingEmail) {
      return res.status(400).json({
        message: "Contact email already exists"
      });
    }

    const company = await Company.create({
      companyName,
      source,
      companyType,
      businessLine,
      businessType,
      noOfLocation,
      noOfEmployee,
      noOfTallyUser,
      turnover,
      address,
      primaryContact,
      tallyLicense,
      remark,
      createdBy: req.user.id
    });

    res.json({
      message: "Company created successfully",
      company
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});
// Update Company
router.put("/update-company/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const {
      companyName,
      source,
      companyType,
      businessLine,
      businessType,
      noOfLocation,
      noOfEmployee,
      noOfTallyUser,
      turnover,
      address,
      primaryContact,
      tallyLicense,
      remark
    } = req.body;

    if (!companyName || !primaryContact?.contactNumber || !primaryContact?.contactEmail) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // check contact number but ignore current company
    const existingNumber = await Company.findOne({
      "primaryContact.contactNumber": primaryContact.contactNumber,
      _id: { $ne: id }
    });

    if (existingNumber) {
      return res.status(400).json({
        message: "Contact number already exists"
      });
    }

    // check email but ignore current company
    const existingEmail = await Company.findOne({
      "primaryContact.contactEmail": primaryContact.contactEmail,
      _id: { $ne: id }
    });

    if (existingEmail) {
      return res.status(400).json({
        message: "Contact email already exists"
      });
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      {
        companyName,
        source,
        companyType,
        businessLine,
        businessType,
        noOfLocation,
        noOfEmployee,
        noOfTallyUser,
        turnover,
        address,
        primaryContact,
        tallyLicense,
        remark
      },
      { new: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({
      message: "Company updated successfully",
      company: updatedCompany
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET USER COMPANIES
router.get("/my-companies", authMiddleware, async (req, res) => {
  try {

    const companies = await Company.find({
      createdBy: req.user.id
    });

    res.json(companies);

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});


// ADMIN GET ALL COMPANIES
router.get("/all-companies", authMiddleware, adminOnly, async (req, res) => {
  try {

    const companies = await Company.find()
      .populate("createdBy", "name email role");

    res.json(companies);

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});


// GET SINGLE COMPANY
router.get("/company/:id", authMiddleware, async (req, res) => {
  try {

    const company = await Company.findById(req.params.id).populate("createdBy", "name email"); ;

    if (!company)
      return res.status(404).json({ message: "Company not found" });

    res.json(company);

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});


module.exports = router;