const mongoose = require("mongoose");

const purchasedMentorshipSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RegisterStudent",
      required: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MentorshipPlan",
      required: true,
      index: true,
    },
    pricePaid: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentId: {
      type: String, 
      required: true,
      unique: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    validityEndDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "refunded"],
      default: "active",
    },
  },
  { timestamps: true }
);

purchasedMentorshipSchema.index({ student: 1, plan: 1 }, { unique: true });

module.exports = mongoose.model(
  "PurchasedMentorship",
  purchasedMentorshipSchema
);
 