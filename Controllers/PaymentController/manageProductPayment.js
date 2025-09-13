const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../../Models/Product/orderModel");
const Product = require("../../models/Product/productModel");
const PromoCode = require("../../models/Course/promocode");
// ✅ Razorpay Instance (env vars for security)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ================== CREATE ORDER ==================
// exports.createOrder = async (req, res) => {
//   try {
//     const { productId, userId, promoCode, shippingAddress,  finalpriceInpaise } = req.body;
//     console.log("we are in createorder function", productId, userId, promoCode, shippingAddress,  finalpriceInpaise)

//     if (!productId || !userId ||!finalpriceInpaise) {
//       return res.status(400).json({ success: false, message: "Missing required fields" });
//     }

//     const product = await Product.findById(productId);
//     if (!product) {
//       return res.status(404).json({ success: false, message: "Product not found" });
//     }

//     // ✅ Price calculation (for now simple, can extend with promo logic)
//     const amountInPaise =   finalpriceInpaise;

//     // ✅ Free Order (below ₹1)
//     if (amountInPaise < 100) {
//       const order = await Order.create({
//         userId,
//         productId,
//         productType: product.productType,
//         amount: 0,
//         currency: "INR",
//         promoCode: promoCode || null,
//         status: "paid",
//         shippingAddress: product.productType === "Book" ? shippingAddress : undefined,
//         razorpay: {
//           orderId: "FREE-ORDER",
//           paymentId: "FREE-ACCESS",
//           signature: "NA",
//         },
//       });
//       return res.json({ success: true, free: true, order });
//     }

//     // ✅ If product is a Book → shipping address mandatory
//     if (product.productType === "Book") {
//       if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone) {
//         return res.status(400).json({
//           success: false,
//           message: "Shipping address is required for Book products",
//         });
//       }
//     }

//     // ✅ Create order in Razorpay
//     const razorpayOrder = await razorpay.orders.create({
//       amount: amountInPaise,
//       currency: "INR",
//       receipt: `order_rcpt_${Date.now()}`,
//     });

//     // ✅ Save order in DB
//     const newOrder = await Order.create({
//       userId,
//       productId,
//       productType: product.productType,
//       amount: amountInPaise,
//       currency: "INR",
//       promoCode: promoCode || null,
//       shippingAddress: product.productType === "Book" ? shippingAddress : undefined,
//       status: "created",
//       razorpay: {
//         orderId: razorpayOrder.id,
//       },
//     });

//     res.json({
//       success: true,
//       orderId: razorpayOrder.id,
//       amount: razorpayOrder.amount,
//       currency: razorpayOrder.currency,
//     });
//   } catch (err) {
//     console.error("Error creating order:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

exports.createOrder = async (req, res) => {
  try {
    const { productId, userId, promoCode, shippingAddress, finalpriceInpaise } = req.body;

    if (!productId || !userId || !finalpriceInpaise) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // ✅ Product check
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let appliedPromo = null;

    // ✅ Agar promoCode bheja hai to uska sirf usage update karna hai
    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode, isActive: true });
      if (!promo) {
        return res.status(400).json({ success: false, message: "Invalid promo code" });
      }

      appliedPromo = promo;
    }

    // ✅ Free Order (amount < 1 INR)
    if (finalpriceInpaise < 100) {
      const order = await Order.create({
        userId,
        productId,
        productType: product.productType,
        amount: 0,
        currency: "INR",
        promoCode: promoCode || null,
        status: "paid",
        shippingAddress: product.productType === "Book" ? shippingAddress : undefined,
        razorpay: {
          orderId: "FREE-ORDER",
          paymentId: "FREE-ACCESS",
          signature: "NA",
        },
      });

      // ✅ Update promo usage
      if (appliedPromo) {
        appliedPromo.usedCount += 1;
        appliedPromo.usedBy.push({ user: userId, product: productId });
        await appliedPromo.save();
      }

      return res.json({ success: true, free: true, order });
    }

    // ✅ Agar Book hai to shipping address mandatory
    if (product.productType === "Book") {
      if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone) {
        return res.status(400).json({
          success: false,
          message: "Shipping address is required for Book products",
        });
      }
    }

    // ✅ Razorpay order banao
    const razorpayOrder = await razorpay.orders.create({
      amount: finalpriceInpaise,
      currency: "INR",
      receipt: `order_rcpt_${Date.now()}`,
    });

    // ✅ DB me save karo
    const newOrder = await Order.create({
      userId,
      productId,
      productType: product.productType,
      amount: finalpriceInpaise,
      currency: "INR",
      promoCode: promoCode || null,
      shippingAddress: product.productType === "Book" ? shippingAddress : undefined,
      status: "created",
      razorpay: {
        orderId: razorpayOrder.id,
      },
    });

    // ✅ Sirf yaha usage update karna hai
    if (appliedPromo) {
      appliedPromo.usedCount += 1;
      appliedPromo.usedBy.push({ user: userId, product: productId });
      await appliedPromo.save();
    }

    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });

  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================== VERIFY PAYMENT ==================
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      productId,
      userId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment data" });
    }

    // ✅ Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment signature mismatch" });
    }

    // ✅ Update order status
    const order = await Order.findOneAndUpdate(
      { "razorpay.orderId": razorpay_order_id, userId, productId },
      {
        status: "paid",
        "razorpay.paymentId": razorpay_payment_id,
        "razorpay.signature": razorpay_signature,
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    console.log("order created successfully:",order)

    res.json({ success: true, order });
  } catch (err) {
    console.error("Error verifying payment:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
 