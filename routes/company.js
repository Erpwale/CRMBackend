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
      tallyLicense=[],
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
      !primaryContact?.designation
     
      
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    // Check unique contact number
    const existingNumber = await Company.findOne({
  "primaryContact.contactNumber": primaryContact.contactNumber
}).populate("createdBy", "name");

const existingCompany = await Company.findOne({
  "companyName": companyName
}).populate("createdBy", "name");


    if (existingNumber) {
      return res.status(400).json({
        message: `Contact number already exists. Company: ${existingNumber.companyName} created by ${existingNumber.createdBy.name}`
      });
    }
   if (existingCompany) {
  return res.status(400).json({
    message: `Company name already exists. Company: ${existingCompany.companyName} created by ${existingCompany.createdBy?.name}`
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
     tallyLicense , 
      remark,
      createdBy: req.user.id
    });
    const existingContact = await Contact.findOne({
  $or: [
    { mobile: primaryContact.contactNumber },
    { email: primaryContact.contactEmail }
  ]
});

if (existingContact) {
  return res.status(400).json({
    message: "Contact already exists in contact table"
  });
}
   await Contact.findOneAndUpdate(
  { companyId: id, primary: true },
  {
    name: primaryContact.name,
    mobile: primaryContact.contactNumber,
    email: primaryContact.contactEmail,
    designation: primaryContact.designation,
    primary: true
  },
  { upsert: true, new: true }
);

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
      tallyLicense = [],   // default array
      remark
    } = req.body;

    if (!companyName || !primaryContact?.contactNumber || !primaryContact?.contactEmail) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Check duplicate company name (ignore current company)
    
  

    // Check duplicate contact number
    const existingNumber = await Company.findOne({
      "primaryContact.contactNumber": primaryContact.contactNumber,
      _id: { $ne: id }
    });

    if (existingNumber) {
      return res.status(400).json({
        message: "Contact number already exists"
      });
    }

    // Check duplicate email
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
        tallyLicense,   // array of licenses
        remark
      },
      { new: true, runValidators: true }
    );
    const existingContact = await Contact.findOne({
  $or: [
    { mobile: primaryContact.contactNumber },
    { email: primaryContact.contactEmail }
  ]
});

if (existingContact) {
  return res.status(400).json({
    message: "Contact already exists in contact table"
  });
}
    await Contact.findOneAndUpdate(
  { companyId: id, primary: true },
  {
    name: primaryContact.name,
    mobile: primaryContact.contactNumber,
    email: primaryContact.contactEmail,
    designation: primaryContact.designation,
     primary: !existingPrimary
  }
);

    if (!updatedCompany) {
      return res.status(404).json({ message: "Company not found" });
    }
   const companyId = updatedCompany._id.toString();

// emit correct data
global.io.to(companyId).emit("companyUpdated", updatedCompany);
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