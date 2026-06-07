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
const TicketMessage= require("../models/Ticketcounter")
const Counter = require("../models/ticketcounterSchema")
const generateTicketNumber = async () => {

  const now = new Date();

  const yy = String(now.getFullYear()).slice(-2);

const mm = now.toLocaleString("en-US", { month: "short" });

  const dd = String(now.getDate()).padStart(2, "0");

  const datePart = `${dd}${mm}${yy}`;
const counter = await Counter.findOneAndUpdate(
    { _id: "erpTicket" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  // random 4 digit
  const random = Math.floor(1000 + Math.random() * 9000);

  let ticketNumber = `#ERP-${random}-${datePart}`;

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
        priority, // 
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
        priority, // ✅ ADD THIS

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

      const ticket = await Ticket.findById(req.params.id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found",
        });
      }

      // prevent duplicate resolve
      if (ticket.status === "resolved") {
        return res.status(400).json({
          success: false,
          message: "Ticket already resolved",
        });
      }

      const oldStatus = ticket.status;

      ticket.status = status;
      ticket.updatedAt = new Date();

      // FIX
      if (!ticket.statusHistory) {
        ticket.statusHistory = [];
      }
const updatedBy =
  req.user?._id || req.customer?._id;

const role =
  req.user?.role || "customer";
  
 ticket.statusHistory.push({
  updatedBy,
  role,
  oldStatus,
  newStatus: status,
  updatedAt: new Date(),
});

      await ticket.save();

      if (status === "Resolved" && ticket.assignedTo) {
        await User.findByIdAndUpdate(ticket.assignedTo, {
          $inc: { activeTickets: -1 },
        });
      }

      res.json({
        success: true,
        ticket,
      });

    } catch (error) {
      console.log(error); // IMPORTANT
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
      .populate({
        path: "assignedTo",
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
      const ticket = await Ticket.findById(req.params.id)
       .populate("companyId", "companyName")
       .populate("assignedTo", "firstName lastName");

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

      .populate({
        path: "assignedTo",
        select: "firstName lastName phone"
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
router.get(
  "/support-stats/:supportId",
  async (req, res) => {
    try {

      const { supportId } = req.params;

      // TOTAL ASSIGNED
      const totalAssigned = await Ticket.countDocuments({
        assignedTo: supportId
      });

      // TOTAL RESOLVED
      const totalResolved = await Ticket.countDocuments({
        assignedTo: supportId,
        status: "resolved"
      });

      // TOTAL PENDING
      const totalPending = await Ticket.countDocuments({
        assignedTo: supportId,
        status: "Waiting on Cust"
      });

      res.status(200).json({
        success: true,
        data: {
          totalAssigned,
          totalResolved,
          totalPending
        }
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

router.get("/customer-stats/:customerId", async (req, res) => {
  try {

    const { customerId } = req.params;

    // TOTAL RAISED TICKETS
    const totalRaised = await Ticket.countDocuments({
      customerId: customerId
    });

    // TOTAL RESOLVED
    const totalResolved = await Ticket.countDocuments({
      customerId: customerId,
      status: "resolved"
    });

    // TOTAL PENDING
    const totalPending = await Ticket.countDocuments({
      customerId: customerId,
      status: "open"
    });

    // TOTAL ONGOING
    const totalOngoing = await Ticket.countDocuments({
      customerId: customerId,
      status: "assigned"
    });

    res.status(200).json({
      success: true,
      data: {
        totalRaised,
        totalResolved,
        totalPending,
        totalOngoing
      }
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
});

router.put("/resolve-ticket/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { resolveRemark, resolvedBy } = req.body;

    if (!resolveRemark) {
      return res.status(400).json({
        success: false,
        message: "Resolve remark is required",
      });
    }

    if (!resolvedBy) {
      return res.status(400).json({
        success: false,
        message: "Resolved by is required",
      });
    }

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const oldStatus = ticket.status;

    ticket.status = "resolved";
    ticket.resolveRemark = resolveRemark;

    // add resolved by
    ticket.resolvedBy = resolvedBy;

    ticket.resolvedAt = new Date();

    ticket.statusHistory.push({
      oldStatus: oldStatus,
      newStatus: "resolved",
      changedBy: resolvedBy,
    });

    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Ticket resolved successfully",
      ticket,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


module.exports = router;


