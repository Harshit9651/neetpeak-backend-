const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    discountType: {
      type: String,
      enum: ["percentage", "flat"], // flat bhi useful hai e-commerce me
      default: "percentage",
    },

    discountValue: {
      type: Number,
      required: true,
    },

    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // Product se link
      },
    ],

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
        user: { type: mongoose.Schema.Types.ObjectId, ref: "RegisterStudent" },
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        usedAt: { type: Date, default: Date.now },
      },
    ],

    minOrderValue: {
      type: Number,
      default: 0, 
    },

    maxDiscount: {
      type: Number,
      default: 0, 
    },

    expiresAt: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.PromoCode || mongoose.model("PromoCode", promoCodeSchema);
