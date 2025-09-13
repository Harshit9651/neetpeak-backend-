const mongoose = require("mongoose");

const mentorshipPlanSchema = new mongoose.Schema(
  {
    planName: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, enum: [3, 6, 12] },
    description: { type: String, trim: true },
    features: { type: [String], default: [] },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

mentorshipPlanSchema.pre("save", function (next) {
  if (this.price > this.mrp) {
    return next(new Error("Price cannot be higher than MRP"));
  }
  next();
});

// 👇 fix: check before compile
module.exports =
  mongoose.models.MentorshipPlan ||
  mongoose.model("MentorshipPlan", mentorshipPlanSchema);
