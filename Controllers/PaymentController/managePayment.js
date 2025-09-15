require('dotenv').config()
const crypto = require("crypto");
const Razorpay = require('razorpay'); 
const MentorshipPlan = require("../../Models/Mentroship/mentorshipModel");
const PurchasedMentorship = require("../../Models/Mentroship/purchasementorshipPlanModel");
const Student = require("../../Models/Student/registerStudentModel");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
 

exports.createOrder = async (req, res) => {
  try {
    const { amount, planId, studentId } = req.body;
    console.log(amount, planId, studentId)

    if (!amount || !planId || !studentId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const student = await Student.findById(studentId);
    const plan = await MentorshipPlan.findById(planId);
console.log("hii")
    if (!student || !plan) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid student or plan" });
    }
   
    const alreadyPurchased = await PurchasedMentorship.findOne({
      student: studentId,
      plan: planId,
    });
    console.log(alreadyPurchased)
    if (alreadyPurchased) {
      return res
        .status(409)
        .json({ success: false, message: "Plan already purchased" });
    }
   

    const options = {
      amount: Math.round(amount * 100), 
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1,
    };
    console.log(options)

    const order = await razorpay.orders.create(options);
console.log("the order recipet is :", order)
    return res.status(200).json({
      success: true,
      orderId: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (err) {
    console.error("Razorpay order error:", err); 
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      studentId,
      planId,
    } = req.body;
   


    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const student = await Student.findById(studentId);
    const plan = await MentorshipPlan.findById(planId);

    if (!student || !plan) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid student or plan" });
    }

   
    const alreadyPurchased = await PurchasedMentorship.findOne({
      student: studentId,
      plan: planId,
    });
    console.log("we are in veryfy payment already purchase ting :",alreadyPurchased)
    if (alreadyPurchased) {
      return res
        .status(409)
        .json({ success: false, message: "Plan already purchased" });
    }

    let validityEndDate = new Date();
    validityEndDate.setMonth(validityEndDate.getMonth() + plan.duration);

    
   const purchaseMentoshipPlan = await PurchasedMentorship.create({
      student: student._id,
      plan: plan._id,
      pricePaid: plan.price,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      validityEndDate,
    });
    student.studentType = "paid";
    await student.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified & mentorship plan purchased",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

exports.getAllPurchasedMentorships = async (req, res) => {
  try {
    console.log("hii");
    const purchases = await PurchasedMentorship.find({})
      .populate({
        path: "student",
        select: "name email mobile",
      })
      .populate({
        path: "plan", 
        select: "planName duration price",
      })
      .sort({ createdAt: -1 });

    console.log("hii2");

    const formatted = purchases.map((p) => ({
      studentName: p.student ? p.student.name : "[Deleted Student]",
      studentEmail: p.student ? p.student.email : "N/A",
      studentPhone: p.student ? p.student.mobile : "N/A",

      planName: p.plan ? p.plan.planName : "[Deleted Plan]",
      planDuration: p.plan ? `${p.plan.duration} Months` : "N/A",
      planPrice: p.plan ? p.plan.price : 0,

      pricePaid: p.pricePaid,
      orderId: p.orderId || "N/A",
      paymentId: p.paymentId || "N/A",
      purchaseDate: p.createdAt,
      validityEndDate: p.validityEndDate,
    }));

    console.log(formatted)
    return res.status(200).json({
      success: true,
      totalPurchases: formatted.length,
      data: formatted,
    });
  } catch (err) {
    console.error("getAllPurchasedMentorships error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentorship purchases",
      error: err.message,
    });
  }
};
