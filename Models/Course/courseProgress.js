const mongoose = require("mongoose");

const courseProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "RegisterStudent", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  completedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
  isCompleted: { type: Boolean, default: false },
  certificateGenerated: { type: Boolean, default: false },
}, { timestamps: true });

courseProgressSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("CourseProgress", courseProgressSchema);
