const Contact = require("../models/Contact");
const SalesOrder = require("../models/SalesOrder");
const Company = require("../models/Company");
const User = require("../models/User");
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const Ticket= require("../models/TicketSchema")
const TicketMessage= require("../models/ticketMessageSchema")
const generateTicketNumber = async () => {

  const now = new Date();

  const yy = String(now.getFullYear()).slice(-2);

  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const dd = String(now.getDate()).padStart(2, "0");

  const datePart = `${yy}${mm}${dd}`;

  // random 4 digit
  const random = Math.floor(1000 + Math.random() * 9000);

  let ticketNumber = `#TLY-${random}-${datePart}`;

  // check duplicate
  const existing = await Ticket.findOne({
    ticketNumber
  });

  if (existing) {
    return generateTicketNumber();
  }

  return ticketNumber;
};
// router.post("/get-full-details", async (req, res) => {
//   try {
//         const { search } = req.body;

//     if (!search) {
//       return res.status(400).json({
//         message: "Mobile or email is required"
//       });
//     }

//     // 1. Find contact using mobile OR email
//     const contact = await Contact.findOne({
//       $or: [
//         { mobile: search },
//         { email: search }
//       ]
//     });

//     if (!contact) {
//       return res.status(404).json({
//         message: "Contact not found"
//       });
//     }
//     // 2. Get Company using companyId
//     const company = await Company.findById(contact.companyId);

//     if (!company) {
//       return res.status(404).json({ message: "Company not found" });
//     }

//     // 3. Get Sales Orders using companyId
//      const salesOrders = await SalesOrder.find({
//       companyName: company.companyName
//     });
//    const user = await User.findById(company.createdBy).select("firstName lastName role email");

//     // 4. Return everything
//     res.json({
//       contact,
//       company,
//       salesOrders,
//       user
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

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

const jwt = require("jsonwebtoken");

router.get("/get-full-details/:id", async (req, res) => {
  try {

    // =========================
    // VERIFY TOKEN
    // =========================

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Token missing"
      });
    }

    const token = authHeader.split(" ")[1];

    // VERIFY + DECODE
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log(decoded);

    // =========================
    // PARAM ID
    // =========================

    const { id } = req.params;

    // Optional security check
    if (decoded.id !== id) {
      return res.status(403).json({
        message: "Unauthorized access"
      });
    }

    // 1. Find contact by ID
    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    // 2. Company
    const company = await Company.findById(
      contact.companyId
    );

    // 3. Sales Orders
    const salesOrders = await SalesOrder.find({
      companyId: company._id
    });

    // 4. User
    const user = await User.findById(
      company.createdBy
    ).select(
      "firstName lastName role email"
    );

    res.json({
      contact,
      company,
      salesOrders,
      user,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error",
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
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const ticketNumber = await generateTicketNumber();
    const {
      companyId,
      tallySerialNo,
      category,
      subCategory,
      description,
      contactPerson,
     
      contactId,
      contactNumber,
      preferredDate,
      preferredTime,
      customerId,
      status
    } = req.body;

    const ticket = await Ticket.create({
      companyId,
      tallySerialNo,
      category,
      subCategory,
      description,
      contactPerson,
      contactId,
       ticketNumber,
      contactNumber,
      preferredDate,
      preferredTime,
      customerId,
      status
    });

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to create ticket"
    });
  }
});

router.put("/assign-ticket/:ticketId", async (req, res) => {
  try {

    const { ticketId } = req.params;

    const {
      supportPersonId,
      assignedBy
    } = req.body;

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    const supportPerson = await User.findById(
      supportPersonId
    );

    if (!supportPerson) {
      return res.status(404).json({
        success: false,
        message: "Support person not found"
      });
    }

    ticket.assignedTo = supportPersonId;

    ticket.assignedBy = assignedBy;

    ticket.assignedAt = new Date();

    ticket.status = "assigned";

    await ticket.save();

    supportPerson.activeTickets += 1;

    await supportPerson.save();

    res.status(200).json({
      success: true,
      message: "Ticket assigned successfully",
      ticket
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
});

router.put(
  "/update-status/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const { status } = req.body;

      const ticket = await Ticket.findByIdAndUpdate(
        req.params.id,
        {
          status,
          updatedAt: new Date(),
        },
        { new: true }
      );

      res.json({
        success: true,
        ticket,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

router.get(
  "/all",
  async (req, res) => {

    try {
      console.log("all")

      const tickets = await Ticket.find();
      console.log(tickets);
      
      res.status(200).json({
        success: true,
        count: tickets.length,
        tickets
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message: error.message
      });

    }
  }
);
router.get(
  "/company-tickets",
  
  async (req, res) => {

    try {

      const companyId = req.user.companyId;
      console.log("hii",companyId);
      

      const tickets = await Ticket.find({
        companyId
      })

      .populate({
        path: "companyId",
        select: "companyName"
      })

      .populate({
        path: "customerId",
        select: "name email"
      })

      .populate({
        path: "contactId",
        select: "name mobile"
      })

      .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: tickets.length,
        tickets
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch tickets"
      });

    }
  }
);

router.get(
  "/details/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id);

      const messages = await TicketMessage.find({
        ticketId: req.params.id,
      })
        .populate("senderId", "fullName email")
        .sort({ createdAt: 1 });

      res.json({
        success: true,
        ticket,
        messages,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);
router.get(
  "/company-tickets/:companyId",
  async (req, res) => {

    try {

      const { companyId } = req.params;

      console.log(companyId);

      const tickets = await Ticket.find({
        companyId
      })

      .populate({
        path: "companyId",
        select:
          "companyName email mobile status"
      })

      .populate({
        path: "customerId",
        select:
          "name email mobile"
      })

      .populate({
        path: "contactId",
        select:
          "name mobile designation"
      })

      .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: tickets.length,
        tickets
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message: error.message
      });

    }
  }
);

module.exports = router;


