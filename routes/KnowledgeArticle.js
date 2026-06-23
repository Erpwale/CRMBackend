// routes/knowledgeRoutes.js

const express = require("express");
const router = express.Router();
const KnowledgeArticle = require("../models/KnowledgeArticle");

// Create Article
router.post("/create", async (req, res) => {
  try {
    const words = req.body.content?.split(" ").length || 0;
    const readTime = Math.ceil(words / 200);

    const article = await KnowledgeArticle.create({
      ...req.body,
      readTime,
      publishedAt:
        req.body.status === "Published"
          ? new Date()
          : null,
    });

    res.status(201).json({
      success: true,
      message: "Article created successfully",
      article,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get All Articles
router.get("/all", async (req, res) => {
  try {
    const articles = await KnowledgeArticle.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get Single Article
router.get("/:id", async (req, res) => {
  try {
    const article = await KnowledgeArticle.findById(
      req.params.id
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found",
      });
    }

    article.views += 1;
    await article.save();

    res.status(200).json({
      success: true,
      article,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update Article
router.put("/update/:id", async (req, res) => {
  try {
    const words = req.body.content?.split(" ").length || 0;
    const readTime = Math.ceil(words / 200);

    const article =
      await KnowledgeArticle.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          readTime,
        },
        {
          new: true,
        }
      );

    res.status(200).json({
      success: true,
      message: "Article updated successfully",
      article,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Publish Article
router.put("/publish/:id", async (req, res) => {
  try {
    const article =
      await KnowledgeArticle.findByIdAndUpdate(
        req.params.id,
        {
          status: "Published",
          publishedAt: new Date(),
        },
        {
          new: true,
        }
      );

    res.status(200).json({
      success: true,
      message: "Article published successfully",
      article,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete Article
router.delete("/delete/:id", async (req, res) => {
  try {
    await KnowledgeArticle.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Article deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;