// routes/productRoutes.js

const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// =====================
// ADD PRODUCT
// =====================
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
});

router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const product = await Product.create({
      productName: req.body.productName,
      description: req.body.description,
      category: req.body.category,
      pricingType: req.body.pricingType,
      price: req.body.price,
      features: JSON.parse(req.body.features || "[]"),
      image: req.file ? req.file.originalname : "",
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================
// FETCH ALL PRODUCTS
// =====================
router.get("/all", async (req, res) => {
  try {
    const products = await Product.find({
      isDeleted: false,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================
// FETCH SINGLE PRODUCT
// =====================
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================
// UPDATE PRODUCT
// =====================
router.put("/update/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================
// TEMP DELETE PRODUCT
// =====================
router.delete("/delete/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================
// RESTORE PRODUCT
// =====================
router.put("/restore/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: false,
        deletedAt: null,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Product restored successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;