const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Create HTTP server
const server = http.createServer(app);

// ✅ Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // change to frontend URL in production
    methods: ["GET", "POST"],
  },
});

// ✅ Socket connection
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("joinCompany", (companyId) => {
    socket.join(companyId);
    console.log("📌 Joined company room:", companyId);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ✅ Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/company", require("./routes/company.js"));
app.use("/api/contact", require("./routes/contact.js"));
app.use("/api/activity", require("./routes/activityRoutes.js"));
app.use("/api/callBooking", require("./routes/CallBolkinRoute.js"));

// ❗ VERY IMPORTANT: export io
module.exports.io = io;

// ✅ Start server (IMPORTANT: use server.listen)
server.listen(process.env.PORT, () => {
  console.log("🚀 Server running on port " + process.env.PORT);
});