const History = require("../models/History");

const saveHistory = async ({
  req,
  user,
  module,
  action,
  recordId = null,
  recordName = "",
  details = "",
  changes = [],
}) => {
  try {
    if (!user) {
      console.warn("saveHistory: user not found");
      return;
    }

    await History.create({
      userId: user._id,
      username:
        user.username ||
        user.name ||
        user.companyName ||
        "Unknown",

      role: user.role || "Customer",

      module,
      action,

      recordId,
      recordName,

      details,
      changes,

      ipAddress:
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress,

      browser: req.headers["user-agent"] || "",
    });
  } catch (err) {
    console.error("History Error:", err);
  }
};

module.exports = saveHistory;