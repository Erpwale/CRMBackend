const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/company", require("./routes/company.js"));
app.use("/api/contact", require("./routes/contact.js"));


app.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
});