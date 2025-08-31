const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ["percentage"],
    default: "percentage"
  },
  discountValue: {
    type: Number,
    required: true,
  },
  applicableCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course"
  }],
  usageLimit: {
    type: Number,
    default: 1,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
usedBy: [
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" }
  }
]
,

  expiresAt: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true
  },
}, {
  timestamps: true
});

module.exports = mongoose.model("PromoCode", promoCodeSchema);
