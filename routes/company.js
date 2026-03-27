const express = require("express");
const Company = require("../models/Company");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const router = express.Router();
const Contact = require("../models/Contact");

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
      tallyLicense = [],
      remark
    } = req.body;

    // ✅ VALIDATION
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
      !address?.district ||
      !address?.state ||
      !address?.pincode ||
      !primaryContact?.name ||
      !primaryContact?.mobile ||
      !primaryContact?.email ||
      !primaryContact?.designation
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    // ✅ CHECK DUPLICATE COMPANY
    const existingCompany = await Company.findOne({ companyName });
    if (existingCompany) {
      return res.status(400).json({
        message: `Company name already exists`
      });
    }

    // ✅ CHECK DUPLICATE CONTACT (Contact Table)
    const existingContact = await Contact.findOne({
      $or: [
        { mobile: primaryContact.mobile },
        { email: primaryContact.email }
      ]
    });

    if (existingContact) {
      return res.status(400).json({
        message: "Contact already exists"
      });
    }

    // ✅ STEP 1: CREATE COMPANY (WITHOUT primaryContact)
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
      tallyLicense,
      remark,
      createdBy: req.user.id
    });

    // ✅ STEP 2: CREATE CONTACT
    const contact = await Contact.create({
      companyId: company._id,
      name: primaryContact.name,
      mobile: primaryContact.mobile,
      email: primaryContact.email,
      designation: primaryContact.designation,
      primary: true,
    
    });

    // ✅ STEP 3: LINK CONTACT TO COMPANY
    company.primaryContact = contact._id;
    await company.save();

    // ✅ RESPONSE
    res.status(201).json({
      message: "Company created successfully",
      company
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Server Error"
    });
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
      tallyLicense = [],
      remark
    } = req.body;
console.log(req.body);

    // ✅ VALIDATION
    if (
      !companyName ||
      !primaryContact?.name ||
      !primaryContact?.mobile ||
      !primaryContact?.email
    ) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // ✅ CHECK COMPANY EXISTS
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // ✅ CHECK DUPLICATE CONTACT (exclude current company contact)
    const existingContact = await Contact.findOne({
      $or: [
        { mobile: primaryContact.mobile },
        { email: primaryContact.email }
      ],
      companyId: { $ne: id }
    });

    if (existingContact) {
      return res.status(400).json({
        message: "Contact already exists for another company"
      });
    }

    // ✅ UPDATE COMPANY (without contact fields)
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
        tallyLicense,
        remark
      },
      { new: true, runValidators: true }
    );

    // ✅ UPDATE PRIMARY CONTACT
    let contact = await Contact.findOne({
      companyId: id,
      primary: true
    });

    if (contact) {
      // update existing
      contact.name = primaryContact.name;
      contact.mobile = primaryContact.mobile;
      contact.email = primaryContact.email;
      contact.designation = primaryContact.designation;
      await contact.save();
    } else {
      // create if not exists
      contact = await Contact.create({
        companyId: id,
        name: primaryContact.name,
        mobile: primaryContact.mobile,
        email: primaryContact.email,
        designation: primaryContact.designation,
        primary: true
      });
    }

    // ✅ LINK CONTACT TO COMPANY (important)
    updatedCompany.primaryContact = contact._id;
    await updatedCompany.save();

    // ✅ SOCKET EMIT
    const companyId = updatedCompany._id.toString();
    global.io.to(companyId).emit("companyUpdated", updatedCompany);

    // ✅ RESPONSE
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
}).populate("primaryContact");

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

    const company = await Company.findById(req.params.id)
    .populate("createdBy", "name email")
     .populate("primaryContact");

    if (!company)
      return res.status(404).json({ message: "Company not found" });

    res.json(company);

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});


module.exports = router;