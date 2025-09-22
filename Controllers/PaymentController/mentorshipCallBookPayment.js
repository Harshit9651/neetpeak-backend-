require('dotenv').config();
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Student = require("../../Models/Student/registerStudentModel");
const MentorshipCall = require("../../Models/Mentroship/mentorshipQuickCallModel");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --------------------- CREATE ORDER ---------------------
exports.createCallOrder = async (req, res) => {
  try {
    const { amount, studentId } = req.body;

    if (!amount || !studentId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const student = await Student.findById(studentId);
    console.log("the student is :", student)
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid student" });
    }

    const options = {
      amount: Math.round(amount * 100), 
      currency: "INR",
      receipt: `call_rcpt_${Date.now()}`,
      payment_capture: 1,
    };
  

    const order = await razorpay.orders.create(options);

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

// --------------------- VERIFY PAYMENT ---------------------
exports.verifyCallPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      studentId,
      price,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment details missing",
      });
    }

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
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid student" });
    }

    
    const mentorshipCall = await MentorshipCall.create({
      student: student._id,
      price,
      paymentStatus: "paid",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      status: "scheduled",
    });
    console.log("Mentorship Call booked:", mentorshipCall);

    return res.status(200).json({
      success: true,
      message: "Payment verified & Mentorship Call booked",
      data: mentorshipCall,
    });
  } catch (err) {
    console.error("verifyCallPayment error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// --------------------- GET ALL CALL BOOKINGS ---------------------
exports.getAllMentorshipCalls = async (req, res) => {
  try {
    const calls = await MentorshipCall.find({})
      .populate({
        path: "student",
        select: "name email mobile",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalCalls: calls.length,
      data: calls,
    });
  } catch (err) {
    console.error("getAllMentorshipCalls error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentorship calls",
      error: err.message,
    });
  }
};
