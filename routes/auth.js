const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const User = require("../models/User");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const router = express.Router();


router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      role,
      phone,
      password,
      confirmPassword,
      monthlyTargets,
      zone
    } = req.body;

    // 1. Required fields
    if (
      !firstName || !lastName || !username || !email ||
      !role || !phone || !password || !confirmPassword ||
      !monthlyTargets || !zone
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Monthly targets check
    if (monthlyTargets.length === 0) {
      return res.status(400).json({ message: "At least one target required" });
    }

    // 3. Username check
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // 4. Phone validation
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone must be 10 digits" });
    }

    // 5. Password validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain uppercase, lowercase, number, and special character"
      });
    }

    // 6. Confirm password
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // 7. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 8. Save
    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      role,
      phone,
      password: hashedPassword,
      monthlyTargets,
      zone
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: newUser
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.status(400).json({ message: "Invalid credentials" });

  const tempToken = jwt.sign(
    { id: user._id},
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  // ✅ Generate secret only once
  if (!user.twoFactorSecret) {
    const secret = speakeasy.generateSecret({ length: 20 });

    user.twoFactorSecret = secret.base32;
    await user.save();

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return res.json({
      require2FASetup: true,
      qrCode,
      tempToken
    });
  }

  // If secret already exists → just verify
  return res.json({
    require2FAVerification: true,
    tempToken
  });
});


// ✅ Verify 2FA Token
router.post("/verify-2fa", async (req, res) => {
  try {
    const { token, tempToken } = req.body;
    console.log("Code",token);

    if (!token || !tempToken)
      return res.status(400).json({ message: "Missing data" });

    // Verify temporary session
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: "2FA not configured" });
    }

    // STRICT 6-digit validation
    if (!/^\d{6}$/.test(token)) {
      return res.status(400).json({ message: "Invalid format" });
    }

    const verified = speakeasy.totp.verify({
  secret: user.twoFactorSecret,
  encoding: "base32",
  token: token,
  window: 2
});



console.log("VERIFIED LOG:", verified);
    console.log("VERIFIED LOG",verified)
  const currentCode = speakeasy.totp({
    secret: user.twoFactorSecret,
    encoding: "base32"
  });

  console.log("Correct Code Should Be:", currentCode);
    if (verified !== true) {
      return res.status(400).json({
        message: "Invalid authentication code"
      });
    }

    // Enable 2FA only after successful verification
    user.isTwoFactorEnabled = true;
    await user.save();

    const finalToken = jwt.sign(
      { id: user._id,
         name: user.name,
      role: user.role
       },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful",
      token: finalToken
    });

  } catch (err) {
  console.log("JWT ERROR:", err.message); // 👈 ADD THIS

  return res.status(401).json({
    message: err.message.includes("expired")
      ? "Session expired"
      : "Invalid session"
  });
  }
});
router.get("/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
});
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user" });
  }
});
module.exports = router;