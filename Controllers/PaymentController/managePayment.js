const crypto = require("crypto");
const Razorpay = require("razorpay");
const PurchasedCourse = require("../../Models/Course/PurchasedCourse");
const PromoCode = require("../../Models/Course/promocode");
const Student = require("../../Models/Student/registerStudentModel");
const Course = require("../../Models/Course/createCourse");
const RegisterStudent = require("../../Models/Student/registerStudentModel");
const CourseProgress = require("../../Models/Course/courseProgress");


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      studentId,
      courseId,
      promoCode,
    } = req.body;

    const isFreeCourse =
      razorpay_order_id === "FREE-ORDER" &&
      razorpay_payment_id === "FREE-ACCESS";

    if (!isFreeCourse) {
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid signature" });
      }
    }

    const student = await Student.findById(studentId);
    const course = await Course.findById(courseId);
    if (!student || !course) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid student or course" });
    }

    const alreadyPurchased = await PurchasedCourse.findOne({
      student: studentId,
      course: courseId,
    });
    if (alreadyPurchased) {
      return res
        .status(409)
        .json({ success: false, message: "Course already purchased" });
    }

    if (promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode });

      if (promo) {
        const alreadyUsed = promo.usedBy.some(
          (entry) =>
            entry.student.toString() === studentId &&
            entry.course.toString() === courseId
        );

        if (!alreadyUsed) {
          if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
            return res.status(400).json({
              success: false,
              message: "Promo code usage limit reached.",
            });
          }

          const isApplicable = promo.applicableCourses.some(
            (id) => id.toString() === courseId
          );
          if (!isApplicable) {
            return res.status(400).json({
              success: false,
              message: "Promo code not applicable to this course.",
            });
          }

          promo.usedCount += 1;
          promo.usedBy.push({ student: student._id, course: course._id });
          await promo.save();
        }
      }
    }

    let validityEndDate = new Date();
    switch (course.duration) {
      case "6 Months":
        validityEndDate.setMonth(validityEndDate.getMonth() + 6);
        break;
      case "1 Year":
        validityEndDate.setFullYear(validityEndDate.getFullYear() + 1);
        break;
      case "Lifetime":
        validityEndDate.setFullYear(validityEndDate.getFullYear() + 100);
        break;
      default:
        validityEndDate.setMonth(validityEndDate.getMonth() + 1);
    }

    await PurchasedCourse.create({
      student: student._id,
      course: course._id,
      pricePaid: isFreeCourse ? 0 : course.price,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      promoCode,
      validityEndDate,
    });
    student.studentType = "paid";
    const updatedStudent = await student.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified & course purchased",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
exports.createOrder = async (req, res) => {
  try {
    const { amount, courseId, studentId, promoCode } = req.body;

    if (!amount || !courseId || !studentId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const student = await Student.findById(studentId);
    const course = await Course.findById(courseId);

    if (!student || !course) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid student or course" });
    }

    const alreadyPurchased = await PurchasedCourse.findOne({
      student: studentId,
      course: courseId,
    });
    if (alreadyPurchased) {
      return res
        .status(409)
        .json({ success: false, message: "Course already purchased" });
    }

    const options = {
      amount: Math.round(amount),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
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
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

exports.getAllPurchasedCoursesDetails = async (req, res) => {
  try {
    const purchases = await PurchasedCourse.find({})
      .populate({
        path: "student",
        select: "name email mobile",
        options: { strictPopulate: false }, // safe populate
      })
      .populate({
        path: "course",
        select: "title duration price",
        options: { strictPopulate: false },
      })
      .sort({ createdAt: -1 });

    const formattedData = purchases.map((purchase) => {
      const student = purchase.student;
      const course = purchase.course;

      return {
        studentName: student ? student.name : "[Deleted Student]",
        studentEmail: student ? student.email : "N/A",
        studentPhone: student ? student.mobile : "N/A",

        courseTitle: course ? course.title : "[Deleted Course]",
        courseDuration: course ? course.duration : "N/A",
        coursePrice: course ? course.price : 0,

        pricePaid: purchase.pricePaid,
        promoCodeUsed: purchase.promoCode || "N/A",
        orderId: purchase.orderId || "N/A",
        paymentId: purchase.paymentId || "N/A",
        purchaseDate: purchase.createdAt,
        validityEndDate: purchase.validityEndDate,

        receipt: {
          transactionId: purchase.paymentId,
          orderId: purchase.orderId,
          paidAmount: purchase.pricePaid,
          receiptDate: purchase.createdAt,
        },
      };
    });

    return res.status(200).json({
      success: true,
      totalPurchases: formattedData.length,
      data: formattedData,
    });
  } catch (err) {
    console.error("Error fetching purchase records:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase records",
      error: err.message,
    });
  }
};

exports.cleanupOrphanPurchasedCourses = async (req, res) => {
  try {
    // 1. Find all purchased courses
    const allPurchases = await PurchasedCourse.find({}).populate("student");

    let deletedCount = 0;

    for (const purchase of allPurchases) {
      if (!purchase.student) {
        // Student has been deleted -> cleanup this purchase
        await PurchasedCourse.findByIdAndDelete(purchase._id);

        // Also clean course progress related to this purchase
        await CourseProgress.deleteMany({ student: purchase.student });

        deletedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `${deletedCount} orphan purchase records deleted successfully`,
    });
  } catch (error) {
    console.error("Error during cleanup:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to cleanup orphan purchase records",
      error: error.message,
    });
  }
};