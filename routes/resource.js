const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const Resource = require("../models/Resource");

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/resources");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// CREATE RESOURCE
router.post("/create", upload.array("files", 10), async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      externalUrl,
      isPublic,
      isPinned,
      status,
    } = req.body;

    let fileUrl = "";
    let fileName = "";
    let fileSize = 0;

const files = req.files?.map((file) => ({
  fileName: file.originalname,
  fileUrl: `/uploads/resources/${file.filename}`,
  fileSize: file.size,
})) || [];
    const resource = await Resource.create({
      title,
      category,
      description,
      externalUrl,
      fileUrl,
      fileName,
      fileSize,
      isPublic,
      isPinned,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Resource uploaded successfully",
      data: resource,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET ALL RESOURCES
router.get("/", async (req, res) => {
  try {
    const resources = await Resource.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: resources,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE RESOURCE
router.delete("/:id", async (req, res) => {
  try {
    await Resource.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Resource deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// UPDATE RESOURCE
router.put("/:id", upload.array("files", 10), async (req, res) => {
  try {
    const updated = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET SINGLE RESOURCE
router.get("/:id", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;