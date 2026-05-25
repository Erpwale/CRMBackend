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
// const generateTicketNumber = async () => {

//   const now = new Date();

//   const yy = String(now.getFullYear()).slice(-2);

//   const mm = String(now.getMonth() + 1).padStart(2, "0");

//   const dd = String(now.getDate()).padStart(2, "0");

//   const datePart = `${yy}${mm}${dd}`;

  // random 4 digit
//   const random = Math.floor(1000 + Math.random() * 9000);
// 
//   let ticketNumber = `#TLY-${random}-${datePart}`;

  // check duplicate
//   const existing = await Ticket.findOne({
//     ticketNumber
//   });

//   if (existing) {
//     return generateTicketNumber();
//   }

//   return ticketNumber;
// };
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

// const transporter = nodemailer.createTransport({
// host: "smtp.hostinger.com",
//   port: 587,
//   secure: false,
//   requireTLS:true,
//   pool: true, // Enable connection pooling
//   maxConnections: 5, // Maximum number of simultaneous connections (default: 5)
//   maxMessages: 100, // Messages per connection before reconnecting (default: 100)
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.PASSWORD,
//   },
//   logger: true,
//   debug: true
// });
// module.exports = transporter;

// const generatePassword = () => {
//   const chars =
//     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!";

//   let password = "";

//   for (let i = 0; i < 8; i++) {
//     password += chars.charAt(
//       Math.floor(Math.random() * chars.length)
//     );
//   }

//   return password;
// };

// const sendPasswordMail = async (user) => {
//   const password = generatePassword();

//   const templatePath = path.join(
//     __dirname,
//     "templates",
//     "template.html"
//   );

//   let htmlTemplate = fs.readFileSync(templatePath, "utf8");

//   htmlTemplate = htmlTemplate
//     .replace("{{Contact_Name}}", user.firstName)
//     .replace("{email}", user.email)
//     .replace("XCsn!23A", password);

//   await transporter.sendMail({
//     from: `"ERPWale Support" <${process.env.EMAIL_USER}>`,
//     to: user.email,
//     subject: "Your Auto Generated Password",
//     html: htmlTemplate,
//   });

//   return password;
// };

// router.post("/send-password", async (req, res) => {
//   try {
//     const user = {
//       firstName: "Deepali",
//       email: "deepalimore609@gmail.com",
//     };

//     const password = await sendPasswordMail(user);

//     res.json({
//       success: true,
//       password,
//     });
//   } catch (error) {
//     console.log(error);

//     res.status(500).json({
//       success: false,
//       message: "Mail sending failed",
//     });
//   }
// });

// const jwt = require("jsonwebtoken");

// router.get("/get-full-details/:id", async (req, res) => {
//   try {

//     // =========================
//     // VERIFY TOKEN
//     // =========================

//     const authHeader = req.headers.authorization;

//     if (!authHeader) {
//       return res.status(401).json({
//         message: "Token missing"
//       });
//     }

//     const token = authHeader.split(" ")[1];

//     // VERIFY + DECODE
//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_SECRET
//     );

//     console.log(decoded);

//     // =========================
//     // PARAM ID
//     // =========================

//     const { id } = req.params;

//     // Optional security check
//     if (decoded.id !== id) {
//       return res.status(403).json({
//         message: "Unauthorized access"
//       });
//     }

//     // 1. Find contact by ID
//     const contact = await Contact.findById(id);

//     if (!contact) {
//       return res.status(404).json({
//         message: "Contact not found",
//       });
//     }

//     // 2. Company
//     const company = await Company.findById(
//       contact.companyId
//     );

//     // 3. Sales Orders
//     const salesOrders = await SalesOrder.find({
//       companyId: company._id
//     });

//     // 4. User
//     const user = await User.findById(
//       company.createdBy
//     ).select(
//       "firstName lastName role email"
//     );

//     res.json({
//       contact,
//       company,
//       salesOrders,
//       user,
//     });

//   } catch (error) {

//     console.error(error);

//     res.status(500).json({
//       message: "Server error",
//     });
//   }
// });
// router.get("/:companyId",  async (req, res) => {
//   try {

//     const contacts = await Contact.find({
//       companyId: req.params.companyId
//     }).sort({ _id: -1 }); // 🔥 latest first

//     res.json({
//       success: true,
//       data: contacts
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Server Error" });
//   }
// });
// router.post("/create", authMiddleware, async (req, res) => {
//   try {
//     const ticketNumber = await generateTicketNumber();
//     const {
//       companyId,
//       tallySerialNo,
//       category,
//       subCategory,
//       description,
//       contactPerson,
     
//       contactId,
//       contactNumber,
//       preferredDate,
//       preferredTime,
//       customerId,
//       status
//     } = req.body;

//     const ticket = await Ticket.create({
//       companyId,
//       tallySerialNo,
//       category,
//       subCategory,
//       description,
//       contactPerson,
//       contactId,
//        ticketNumber,
//       contactNumber,
//       preferredDate,
//       preferredTime,
//       customerId,
//       status
//     });

//     res.status(201).json({
//       success: true,
//       message: "Ticket created successfully",
//       ticket
//     });

//   } catch (error) {
//     console.log(error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to create ticket"
//     });
//   }
// });
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
// router.get(
//   "/company-tickets",
  
//   async (req, res) => {

//     try {

//       const companyId = req.user.companyId;
//       console.log("hii",companyId);
      

//       const tickets = await Ticket.find({
//         companyId
//       })

//       .populate({
//         path: "companyId",
//         select: "companyName"
//       })

//       .populate({
//         path: "customerId",
//         select: "name email"
//       })

//       .populate({
//         path: "contactId",
//         select: "name mobile"
//       })

//       .sort({ createdAt: -1 });

//       res.status(200).json({
//         success: true,
//         count: tickets.length,
//         tickets
//       });

//     } catch (error) {

//       console.log(error);

//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch tickets"
//       });

//     }
//   }
// );

// router.get(
//   "/details/:id",
//   authMiddleware,
//   async (req, res) => {
//     try {

//       const ticket = await Ticket.findById(
//         req.params.id
//       )
//       .populate("companyId")
//       .populate("contactId")
//       .populate("customerId");

//       if (!ticket) {
//         return res.status(404).json({
//           success: false,
//           message: "Ticket not found"
//         });
//       }

//       res.status(200).json({
//         success: true,
//         ticket
//       });

//     } catch (error) {

//       console.log(error);

//       res.status(500).json({
//         success: false,
//         message: "Failed to fetch ticket"
//       });

//     }
//   }
// );
// router.get(
//   "/company-tickets/:companyId",
//   async (req, res) => {

//     try {

//       const { companyId } = req.params;

//       console.log(companyId);

//       const tickets = await Ticket.find({
//         companyId
//       })

//       .populate({
//         path: "companyId",
//         select:
//           "companyName email mobile status"
//       })

//       .populate({
//         path: "customerId",
//         select:
//           "name email mobile"
//       })

//       .populate({
//         path: "contactId",
//         select:
//           "name mobile designation"
//       })

//       .sort({ createdAt: -1 });

//       res.status(200).json({
//         success: true,
//         count: tickets.length,
//         tickets
//       });

//     } catch (error) {

//       console.log(error);

//       res.status(500).json({
//         success: false,
//         message: error.message
//       });

//     }
//   }
// );

router.get("/support-persons", async (req, res) => {

  try {

    const persons = await User.find({role:"Support Executive"});

    res.status(200).json({
      success: true,
      persons,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch persons",
    });

  }

});

/* ========================= */
/* ✅ GET SALES ORDER BY COMPANY ID */
/* ========================= */

router.get("/company/:companyId", async (req, res) => {
  try {

    const { companyId } = req.params;

    const orders = await SalesOrder.find({
      companyId: companyId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});


router.get("/amc/:companyId", async (req, res) => {

  try {

    // ✅ fetch all company orders
    const orders = await SalesOrder.find({
      companyId: req.params.companyId
    }).sort({ createdAt: -1 });

    // ✅ add AMC status in every order
    const data = orders.map((order) => {

      let supportStatus = "No Support Cover";
      let expiryDate = null;
      let daysLeft = null;

      // ✅ payment check
      const paymentDone =
        order.pendingAmount <= 0 ||
        order.receivedAmount >= order.grossTotal;
      console.log("payment done",paymentDone)
      // ✅ only Annual Support Cover
      if (
        order.businessLine === "Annual Support Cover"
      ) {

        // ✅ unpaid
        if (!paymentDone) {

          supportStatus = "Payment Pending";

        } else {

          // ✅ calculate expiry
          expiryDate = new Date(order.orderDate);

          // add 1 year
          expiryDate.setFullYear(
            expiryDate.getFullYear() + 1
          );

          const today = new Date();

          daysLeft = Math.ceil(
            (expiryDate - today) /
            (1000 * 60 * 60 * 24)
          );

          // ✅ status
          if (daysLeft < 0) {

            supportStatus = "Expired";

          } else if (daysLeft <= 30) {

            supportStatus = "About to Expire";

          } else {

            supportStatus = "Active";

          }

        }

      }

      return {
        ...order.toObject(),
        supportStatus,
        expiryDate,
        daysLeft
      };

    });
    console.log("data",data)
    // ✅ only show paid AMC plans
    const paidAMC = data.filter(
      (item) =>
        item.businessLine === "Annual Support Cover" &&
        item.supportStatus !== "Payment Pending"
    );

    console.log("paidAMC",paidAMC)
    res.json({
      success: true,
      data: paidAMC
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

});



module.exports = router;


