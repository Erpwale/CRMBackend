const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const User = require("../models/User");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const router = express.Router();


router.post("/register" async (req, res) => {
  const { email, password, confirmPassword, role } = req.body;

  if (!email || !password || !confirmPassword)
    return res.status(400).json({ message: "All fields required" });

  // Email lowercase
  const formattedEmail = email.toLowerCase().trim();

  // Check password match
  if (password !== confirmPassword)
    return res.status(400).json({ message: "Passwords do not match" });

  // Strong password validation
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

  if (!passwordRegex.test(password))
    return res.status(400).json({
      message:
        "Password must contain 8+ characters, uppercase, lowercase, number & special symbol"
    });

  try {
    const existingUser = await User.findOne({ email: formattedEmail });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: formattedEmail,
      password: hashedPassword,
      role: role || "user"
    });

    res.json({ message: "User Registered Successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
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
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
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
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful",
      token: finalToken
    });

  } catch (err) {
    return res.status(401).json({
      message: "Session expired or invalid"
    });
  }
});

module.exports = router;