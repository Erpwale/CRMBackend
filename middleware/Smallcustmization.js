const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = "uploads/opportunity";

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  cb(null, true); // Allow all file types
};

module.exports = multer({
  storage,
  fileFilter,
});