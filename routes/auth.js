const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const User = require("../models/User");
const { authMiddleware, adminOnly } = require("../middleware/auth");
const router = express.Router();
const geoip = require("geoip-lite");
const history = require("../models/History")

router.post("/register", async (req, res) => {
  try {
  const {
  firstName,
  lastName,
  username,
  email,
  role,
  department,
  team,
  reportingManager,
  phone,
  password,
  confirmPassword,
  monthlyTargets,
  zones,
  joiningDate,
  linkedinLink,
  whatsappLink,
  calendlyLink,

  mailApiKey,
  mailPassword,
  address,
  city,
  district,
  state,
  pincode,
  bloodGroup,
  emergencyNumber
} = req.body;

    // Required validations
    if (
      !firstName ||
      !lastName ||
      !username ||
      !email ||
      !role ||
      !department ||
      !team ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: "All required fields are mandatory"
      });
    }

    // Username exists
    const existingUsername = await User.findOne({ username });

    if (existingUsername) {
      return res.status(400).json({
        message: "Username already exists"
      });
    }

    // Email exists
    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    // Phone validation
    if (!/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({
        message: "Phone number must be 10 digits"
      });
    }

    // Password validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain uppercase, lowercase, number and special character"
      });
    }

    // Confirm password
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match"
      });
    }

    // Manager roles
    const managerRoles = [
      "Sales Manager",
      "Support Manager",
      "Accounts Manager",
      "Devloper Manager",

      "HR Manager"
    ];

    const isManager = managerRoles.includes(role);

    // Find existing team
    const existingTeam = await User.findOne({
      team: team.trim()
    });

    // TEAM EXISTS
    if (existingTeam) {

      // Team exists in another department
      if (existingTeam.department !== department) {
        return res.status(400).json({
          message:
            `Team already belongs to ${existingTeam.department} department`
        });
      }

      // Only one manager per team
      if (isManager) {

        const existingManager = await User.findOne({
          team: team.trim(),
          role: { $in: managerRoles }
        });

        if (existingManager) {
          return res.status(400).json({
            message:
              `Team already has manager ${existingManager.firstName} ${existingManager.lastName}`
          });
        }
      }
    }

    // TEAM DOES NOT EXIST
    else {

      // First user of team must be manager
      if (!isManager) {
        return res.status(400).json({
          message:
            "Team does not exist. First member must be a manager"
        });
      }
    }

   if (
  department === "Sales" &&
  (
    !monthlyTargets ||
    !Array.isArray(monthlyTargets) ||
    monthlyTargets.length === 0
  )
) {
  return res.status(400).json({
    message: "At least one monthly target required"
  });
}

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
  const newUser = new User({
  firstName,
  lastName,
  username,
  email,
  role,
  department,
  team,
  reportingManager,
  phone,
  password: hashedPassword,

  monthlyTargets,
  zones,
  joiningDate,

  linkedinLink,
  whatsappLink,
  calendlyLink,

  mailApiKey,
  mailPassword,

  address,
  city,
  state,
  district,
  pincode,

  bloodGroup,
  emergencyNumber
});

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: newUser
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
});

router.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({
        message: "Invalid credentials"
      });
 // ✅ Check user status
    // if (user.status !== "active") {
    //   return res.status(403).json({
    //     message: "Your account is inactive. Please contact administrator.",
    //   });
    // }
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch)
      return res.status(400).json({
        message: "Invalid credentials"
      });

    // =========================
    // DEVICE INFO
    // =========================

  

    // =========================
    // IP + LOCATION
    // =========================

    // const ip =
    //   req.headers["x-forwarded-for"] ||
    //   req.socket.remoteAddress;

  const forwarded = req.headers["x-forwarded-for"];

const ip = forwarded
  ? forwarded.split(",")[0].trim()
  : req.socket.remoteAddress;

const geo = geoip.lookup(ip);

console.log("IP:", ip);
console.log("Location:", geo);

    // =========================
    // SAVE LOGIN HISTORY
    // =========================

    await history.create({

      userId: user._id,

      username: user.username,

      role: user.role,

      action: "LOGIN",

      module: "AUTH",

      details: `${user.username} logged into CRM`,

      ipAddress: ip,

      location: geo
        ? `${geo.city || ""}, ${geo.region || ""}, ${geo.country || ""}`
        : "Unknown",

      coordinates: geo
        ? {
            lat: geo.ll[0],
            lng: geo.ll[1]
          }
        : null,

      // browser:
      //   `${browser.name || ""} ${browser.version || ""}`,

      // operatingSystem:
      //   `${os.name || ""} ${os.version || ""}`,

      // deviceName:
      //   device.model || "Desktop",

      // deviceType:
      //   device.type || "Desktop",

      loginTime: new Date()

    });

    // =========================
    // TEMP TOKEN
    // =========================

    const tempToken = jwt.sign(
      {
        id: user._id,
        userName: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      }
    );

    // =========================
    // 2FA SETUP
    // =========================

    if (!user.twoFactorSecret) {

      const secret = speakeasy.generateSecret({
        length: 20
      });

      user.twoFactorSecret = secret.base32;

      await user.save();

      const qrCode = await QRCode.toDataURL(
        secret.otpauth_url
      );

      return res.json({
        require2FASetup: true,
        qrCode,
        tempToken
      });
    }

    // =========================
    // VERIFY 2FA
    // =========================

    return res.json({
      require2FAVerification: true,
      tempToken
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server Error"
    });

  }

});

const blacklistedTokens = [];

router.post("/logout", async (req, res) => {
  try {

    const authHeader =
      req.headers.authorization;

    const token = authHeader?.split(" ")[1];

    if (token) {
      blacklistedTokens.push(token);
    }

    return res.status(200).json({
      success: true,
      message: "Logout successful"
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Logout failed"
    });
  }
});
// ✅ Verify 2FA Token
router.post("/verify-2fa", async (req, res) => {
  try {
    const { token, tempToken } = req.body;
    console.log("Code",token);

    if (!token || !tempToken)
      return res.status(400).json({ message: "Missing data" });

    // Verify temporary session
  let decoded;

try {
  decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
} catch (err) {
  console.log("VERIFY ERROR:", err.message);

  return res.status(401).json({
    message: "Invalid session"
  });
}

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
  {
    id: user._id,
    userName: user.username,
    email: user.email,
    role: user.role,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "1d",
  }
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

    // only admin can access
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    const users = await User.find().select("-password");

    res.json(users);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching users"
    });
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

router.get("/teams", async (req, res) => {

  try {

    const { department, search } = req.query;

    // Validation
    if (!department) {
      return res.status(400).json({
        message: "Department is required"
      });
    }

    // Query
    const query = {
      department
    };

    // Search by team name
    if (search) {
      query.team = {
        $regex: search,
        $options: "i"
      };
    }

    // Find teams
    const users = await User.find(query)
      .select("team department")
      .lean();

    // Remove duplicate teams
    const uniqueTeams = [
      ...new Map(
        users.map((item) => [
          item.team.toLowerCase(),
          item
        ])
      ).values()
    ];

    // Sort alphabetically
    uniqueTeams.sort((a, b) =>
      a.team.localeCompare(b.team)
    );

    res.status(200).json(uniqueTeams);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server Error"
    });

  }

});
router.get("/managers", async (req, res) => {
  try {
    const { department, role, team } = req.query;

    const managers = await User.find({
      department,
      role,
      team
    }).select("firstName lastName username");

    res.json(managers);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
});

router.get("/fix-users", async (req, res) => {
  try {
    console.log("🔧 Fixing users...");

    // ✅ Step 1: Fix username (set = email)
    const usersWithoutUsername = await User.find({
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: "" }
      ]
    });

    for (const user of usersWithoutUsername) {
      await User.updateOne(
        { _id: user._id },
        { $set: { username: user.email } }
      );
    }

    console.log(`✅ Username fixed for ${usersWithoutUsername.length} users`);

    // ✅ Step 2: Fix other missing fields
    const result = await User.updateMany(
      {
        $or: [
          { firstName: { $exists: false } },
          { lastName: { $exists: false } },
          { phone: { $exists: false } },
          { zone: { $exists: false } }
        ]
      },
      {
        $set: {
          firstName: "User",
          lastName: "User",
          phone: "0000000000",
          zone: "Default Zone"
        }
      }
    );

    console.log(`✅ Other fields fixed: ${result.modifiedCount}`);

    res.json({
      message: "Users fixed successfully ✅",
      usernameUpdated: usersWithoutUsername.length,
      otherFieldsUpdated: result.modifiedCount
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({
      message: "Error fixing users",
      error: err.message
    });
  }
});
router.get("/developers", async (req, res) => {
  try {
    const developers = await User.find(
      {
        role: "Devloper",
      },
      {
        password: 0,
        confirmPassword: 0,
      }
    ).sort({ firstName: 1 });

    res.status(200).json(developers);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to fetch developers",
    });
  }
});
router.post(
  "/logout",
  authMiddleware,
  async (req, res) => {

    try {

      const user = await User.findById(
        req.user.id
      );

      const forwarded =
        req.headers["x-forwarded-for"];

      const ip = forwarded
        ? forwarded.split(",")[0].trim()
        : req.socket.remoteAddress;
const geo = geoip.lookup(ip);

console.log("IP:", ip);
console.log("Location:", geo);
      // Logout reason
      const reason = req.body.reason;

      let description =
        `${user.username} logged out from CRM`;

      // Auto inactivity logout
      if (reason === "INACTIVE") {

        description =
          `${user.username} was automatically logged out due to inactivity`;

      }

      await history.create({

        userId: user._id,

        username: user.username,

        role: user.role,

        action: "LOGOUT",

        module: "AUTH",

        details: description,

        ipAddress: ip,
         location: geo
        ? `${geo.city || ""}, ${geo.region || ""}, ${geo.country || ""}`
        : "Unknown",

      coordinates: geo
        ? {
            lat: geo.ll[0],
            lng: geo.ll[1]
          }
        : null,

        logoutTime: new Date()

      });

      res.status(200).json({
        message: "Logout successful"
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        message: "Server Error"
      });

    }

  }
);
router.put("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const updateData = { ...req.body };

    delete updateData.password;
    delete updateData.confirmPassword;

    Object.assign(user, updateData);

    // Password changed
    if (req.body.password && req.body.password.trim() !== "") {
      user.password = await bcrypt.hash(req.body.password, 10);

      // Reset 2FA
      user.twoFactorSecret = null;
      user.isTwoFactorEnabled = false;
    }

    await user.save();

    res.json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});
// Fetch History of user
router.put("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: `User ${status} successfully`,
      user,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

router.get(
  "/activity/:userId",
  authMiddleware,
  async (req, res) => {

    try {

      const { userId } = req.params;

      const activities = await history.find({
        userId
      })
        .sort({ createdAt: -1 });

      res.status(200).json(activities);

    } catch (error) {

      console.log(error);

      res.status(500).json({
        message: "Server Error"
      });

    }

  }
);



router.get("/last-login/:id", async (req, res) => {
  try {
    console.log("User Id:", req.params.id);

    const lastLogin = await history.findOne({
      userId: req.params.id,
      action: "LOGIN"
    }).sort({ createdAt: -1 });

    console.log("Last Login:", lastLogin);

    res.json(lastLogin);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});
module.exports = router;