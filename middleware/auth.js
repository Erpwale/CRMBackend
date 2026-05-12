const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Contact = require("../models/Contact")

exports.authMiddleware = async (req, res, next) => {
  try {
    const token =
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );
    console.log(decoded)

    // ✅ First check User
    const user = await User.findById(decoded.id);

    if (user) {
      req.user = user;
      req.authType = "user";
      return next();
    }

    // ✅ Then check CustomerLogin
    const customer = await Contact.findById(
      decoded.id
    );

    if (customer) {
      req.customer = customer;
      req.authType = "customer";
      return next();
    }

    return res.status(401).json({
      message: "Invalid token"
    });

  } catch (err) {
    console.log(err);

    return res.status(401).json({
      message: "Invalid token"
    });
  }
};

exports.customerAuth = async (req, res, next) => {
  try {
    const token =
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.customer = await Contact.findById(
      decoded.id
    );

    next();

  } catch (err) {
    return res.status(401).json({
      message: "Invalid token"
    });
  }
};


exports.adminOnly = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin access required" });

  next();
};