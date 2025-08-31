const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema({
  title: String,
  content: String,
  thumbnail:String,
  images: [String],
  wordCount: Number,
  charCount: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
    category: {
    type: String,
    enum: [
      "BTP",
      "FIORI",
      "UI5",
      "ABAP",
      "Build apps",
      "Build process automation",
      "Build workzone",
      "AI",
      "CAPM",
      "RAP"
    ],
    required: true
  },
  draft:{
    type: Boolean,
    default: false,
  }
});

const Blog = mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
module.exports = Blog;
