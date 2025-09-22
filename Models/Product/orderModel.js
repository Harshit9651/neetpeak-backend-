const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RegisterStudent",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productType: {
      type: String,
      enum: ["Book", "OnlineProduct"],
      required: true,
    },
    // ✅ Address (required only if productType === Book)
    shippingAddress: {
      fullName: { type: String },
      phone: { type: String },
     addressLine: { type: String },
          district:{type:String},
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String, default: "India" },
    },
     
  
    amount: { type: Number, required: true }, // in paise
    currency: { type: String, default: "INR" },
    promoCode: { type: String, default: null },
    razorpay: {
      orderId: String,
      paymentId: String,
      signature: String,
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
