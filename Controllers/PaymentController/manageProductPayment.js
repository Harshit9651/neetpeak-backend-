const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../../Models/Product/orderModel");
const Product = require("../../Models/Product/productModel");
const PromoCode = require("../../Models/Course/promocode");
const axios = require("axios")

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});



exports.createOrder = async (req, res) => {
  try {
    const { productId, userId, promoCode, shippingAddress, finalpriceInpaise } = req.body;

    if (!productId || !userId || !finalpriceInpaise) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let appliedPromo = null;


    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode, isActive: true });
      if (!promo) {
        return res.status(400).json({ success: false, message: "Invalid promo code" });
      }

      appliedPromo = promo;
    }

 
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

      if (appliedPromo) {
        appliedPromo.usedCount += 1;
        appliedPromo.usedBy.push({ user: userId, product: productId });
        await appliedPromo.save();
      }

      return res.json({ success: true, free: true, order });
    }

    
    if (product.productType === "Book") {
      if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone) {
        return res.status(400).json({
          success: false,
          message: "Shipping address is required for Book products",
        });
      }
    }


    const razorpayOrder = await razorpay.orders.create({
      amount: finalpriceInpaise,
      currency: "INR",
      receipt: `order_rcpt_${Date.now()}`,
    });


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

// exports.verifyPayment = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       productId,
//       userId,
//     } = req.body;

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({ success: false, message: "Invalid payment data" });
//     }

//     // ✅ Verify signature
//     const body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body.toString())
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       return res.status(400).json({ success: false, message: "Payment signature mismatch" });
//     }

//     // ✅ Update order status
//     const order = await Order.findOneAndUpdate(
//       { "razorpay.orderId": razorpay_order_id, userId, productId },
//       {
//         status: "paid",
//         "razorpay.paymentId": razorpay_payment_id,
//         "razorpay.signature": razorpay_signature,
//       },
//       { new: true }
//     );

//     if (!order) {
//       return res.status(404).json({ success: false, message: "Order not found" });
//     }
//     console.log("order created successfully check itt :",order)

//     res.json({ success: true, order });
//   } catch (err) {
//     console.error("Error verifying payment:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      productId,
      userId,
        quantity
    } = req.body;
console.log("the body is :",req.body)
    // ✅ Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment data" });
    }

    // ✅ Verify Razorpay Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Payment signature mismatch" });
    }

    // ✅ Update Order in DB
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
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    console.log("✅ Order paid successfully. Amount:", order.amount);

    // ✅ If product is OnlineProduct → No shipment
    if (order.productType === "OnlineProduct") {
      return res.json({
        success: true,
        message: "Payment verified. No shipment required for online products.",
        order,
      });
    }

    // ✅ Shipment only for physical products
    const addr = order.shippingAddress;
    if (!addr || !addr.pincode) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is missing for physical product.",
      });
    }

    console.log("✅ Creating ExpressFly shipment...", addr);

    // 🔑 STEP 1: Get Token from ExpressFly Auth API
    const loginRes = await axios.post(
      "https://cp.expressfly.in/2.1/api-login",
      {
        email: "neetpeak.delevery@gmail.com",
        password: "7891858821",
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const token = loginRes.data?.data?.token;
    if (!token) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch ExpressFly token",
      });
    }
    console.log("✅ ExpressFly token received.");

    // 🔑 STEP 2: Get Logistic Options
    const priceRes = await axios.post(
      "https://cp.expressfly.in/2.1/api-calculate-price",
      {
        paymentMode: 0, // prepaid
        pickupPinCode: 312601, // your warehouse pincode
        deliveryPinCode: Number(addr.pincode),
        multiChecked: "off",
        apprWeight: 1,
        b2c_length: 10,
        b2c_breadth: 10,
        b2c_height: 10,
        total_Weight: 1,
        declaredValue: order.amount / 100,
        box_shipment: [
          {
            no_of_box: 1,
            length: 10,
            breadth: 10,
            height: 10,
            each_box_weight: 1,
          },
        ],
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // 🧾 Response looks like: { data: { rates: { list: { '68': {...}, '78': {...} } } } }
    const logisticsObj = priceRes.data?.data?.rates?.list || {};
    const logisticsList = Object.values(logisticsObj);

    if (logisticsList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No logistic available for this pincode",
        details: priceRes.data,
      });
    }

    // console.log(
    //   "✅ Available Logistics:",
    //   logisticsList.map((l) => l.api_name)
    // );

    // 🔍 Prefer BlueDart if available
    let selectedLogistic = logisticsList.find(
      (log) => log.api_name?.toLowerCase() === "bluedart"
    );

    if (!selectedLogistic) {
      selectedLogistic = logisticsList[0];
      console.log("⚠️ BlueDart not available. Using first logistic option.");
    }

    const logisticId = selectedLogistic.logistic_id;
    console.log(
      "✅ Selected Logistic:",
      selectedLogistic.api_name,
      "ID:",
      logisticId
    );

    // 🔑 STEP 3: Build Shipment Payload
    const payload = {
      logistic_id: logisticId,
      consignee_name: addr.fullName,
      mobile_no: addr.phone,
      alternate_mobile_no: addr.phone,
      email_id: addr.email || "customer@example.com",
      receiver_address: addr.addressLine,
      receiver_pincode: Number(addr.pincode),
      receiver_city: addr.city,
      receiver_state: addr.state,
      receiver_landmark: addr.district || "N/A",
      customer_order_no: razorpay_order_id,
      order_type: 1, // prepaid
      product_quantity:       quantity || 1,
      cod_amount: 0,
      physical_weight: 1,
      product_length: 10,
      product_width: 10,
      product_height: 10,
      hsn_number: "1234",
      order_value: order.amount / 100,
      productdetatis: [
        {
          sku_number: "SKU-" + productId,
          product_name: "Book",
          product_quantity:      quantity || 1,
          product_value: order.amount / 100,
        },
      ],
      sender_address_id: 6557, // your ExpressFly sender address ID
      return_address_same_as_pickup_address: 1,
    };

    console.log("✅ Shipment Payload:", payload);

    // 🔑 STEP 4: Create Shipment
    const expressRes = await axios.post(
      "https://cp.expressfly.in/2.1/api-b2c-quick-shipment",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Shipment Created:", expressRes.data);

    // ✅ Optional: Save logistic details in order
    order.logisticDetails = {
      courier: selectedLogistic.api_name,
      logistic_id: selectedLogistic.logistic_id,
      courier_logo: selectedLogistic.logo_image,
      total_charge: selectedLogistic.total,
      expected_delivery: selectedLogistic.expressfly_edd,
      tracking_data: expressRes.data,
    };
    await order.save();

    res.json({
      success: true,
      message: `Payment verified & shipment created successfully with ${selectedLogistic.api_name}`,
      order,
      shipment: expressRes.data,
    });
  } catch (err) {
    console.error(
      "❌ Error verifying payment or creating shipment:",
      err.response?.data || err.message
    );
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.response?.data || err.message,
    });
  }
};