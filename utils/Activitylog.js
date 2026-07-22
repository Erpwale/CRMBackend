const ActivityLog = require("../models/Activitylog");

const logActivity = async ({
  userId,
  action,
  module,
  description,
  recordId,
  recordName,
  req,
}) => {
  try {
    await ActivityLog.create({
      userId,
      action,
      module,
      description,
      recordId,
      recordName,
      ipAddress:
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress,
      browser: req.headers["user-agent"],
      route: req.originalUrl,
      method: req.method,
    });
  } catch (err) {
    console.log(err);
  }
};

module.exports = logActivity;