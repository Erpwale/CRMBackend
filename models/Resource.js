const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
 
    externalUrl: {
      type: String,
      default: "",
    },
   files: [
  {
    fileName: String,
    fileUrl: String,
    fileSize: Number,
  },
],
    isPublic: {
      type: Boolean,
      default: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Draft",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Resource", ResourceSchema);