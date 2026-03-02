const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const User = require("../models/User");

const router = express.Router();


// ✅ Register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await User.create({
      email,
      password: hashedPassword
    });
    res.json({ message: "User Registered" });
  } catch (err) {
    console.log(err)
    res.status(400).json({ message: "Email already exists" });
  }
});


// ✅ Login Step 1 (Check email & password)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.status(400).json({ message: "Invalid password" });

  // If 2FA not enabled → Setup QR
  if (!user.isTwoFactorEnabled) {
    const secret = speakeasy.generateSecret({ length: 20 });

    user.twoFactorSecret = secret.base32;
    await user.save();

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return res.json({
      require2FASetup: true,
      qrCode
    });
  }

  // If already enabled → Ask for token
  return res.json({
    require2FAVerification: true
  });
});


// ✅ Verify 2FA Token
router.post("/verify-2fa", async (req, res) => {
  const { email, token } = req.body;

  const user = await User.findOne({ email });

  const verified = speakeasy.totp({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token
  });

  if (!verified)
    return res.status(400).json({ message: "Invalid code" });

  user.isTwoFactorEnabled = true;
  await user.save();

  const jwtToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    message: "Login Successful",
    token: jwtToken
  });
});

module.exports = router;