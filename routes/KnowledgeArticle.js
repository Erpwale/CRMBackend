// routes/knowledgeRoutes.js

const express = require("express");
const router = express.Router();
const KnowledgeArticle = require("../models/KnowledgeArticle");
const logActivity = require("../utils/Activitylog");
const { authMiddleware } = require("../middleware/auth");
// Create Article
router.post("/create", authMiddleware, async (req, res) => {
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
await logActivity({
  req,
  userId: req.user.id,
  module: "KNOWLEDGE_BASE",
  action: "CREATE",
  description: `Created knowledge article "${article.title}"`,
  recordId: article._id,
  recordName: article.title,
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
router.put("/update/:id", authMiddleware, async (req, res) => {
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
      await logActivity({
  req,
  userId: req.user.id,
  module: "KNOWLEDGE_BASE",
  action: "UPDATE",
  description: `Updated knowledge article "${article.title}"`,
  recordId: article._id,
  recordName: article.title,
});

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
router.put("/publish/:id", authMiddleware, async (req, res) => {  try {
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
await logActivity({
  req,
  userId: req.user.id,
  module: "KNOWLEDGE_BASE",
  action: "PUBLISH",
  description: `Published knowledge article "${article.title}"`,
  recordId: article._id,
  recordName: article.title,
});
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
router.delete("/delete/:id", authMiddleware, async (req, res) => {  try {
    await KnowledgeArticle.findByIdAndDelete(
      req.params.id
    );
await logActivity({
  req,
  userId: req.user.id,
  module: "KNOWLEDGE_BASE",
  action: "DELETE",
  description: `Deleted knowledge article "${article.title}"`,
  recordId: article._id,
  recordName: article.title,
});
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