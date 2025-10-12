require("dotenv").config();
const mongoose = require("mongoose");
const RegisterStudent = require("../../Models/Student/registerStudentModel");
const PurchasedCourse = require("../../Models/Course/PurchasedCourse");
const CourseProgress = require("../../Models/Course/courseProgress");
const PurchasedMentorship = require("../../Models/Mentroship/purchasementorshipPlanModel");
const Order = require("../../Models/Product/orderModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { fork } = require("child_process");
const { uploadToCloudinary } = require("../../Services/cloudinary.service");

const { console } = require("inspector");
const { error } = require("console");
const Session = require("../../Models/Student/studentSessionModel");
const { sendEmail } = require("../../Services/emailSender");
const { Agent } = require("http");
exports.loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userAgent = req.headers["user-agent"];
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const student = await RegisterStudent.findOne({ email }).select(
      "+password"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        id: student._id,
        email: student.email,
        name: student.name,
        studentType: student.studentType || "unpaid",
      },
      process.env.JWT_TEMP_SECRET_KEY,
      { expiresIn: "1h" }
    );

    const activeSessions = await Session.find({ userId: student._id });

    const isSameDevice = activeSessions.some(
      (session) => session.ip === ip && session.userAgent === userAgent
    );
    if (!isSameDevice && activeSessions.length >= 2) {
      return res.status(403).json({
        message: "Login limit reached. Logout from another device to continue.",
      });
    }
    if (!isSameDevice) {
      await Session.create({ userId: student._id, token, ip, userAgent });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      student,
      ip: ip,
      Agent: userAgent,
      LoginbySameDevice: isSameDevice,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
function createTempToken(payload) {
  const secret = process.env.JWT_TEMP_SECRET_KEY;
  return jwt.sign(payload, secret, { expiresIn: "5m" });
}

function verifyTempToken(token) {
  const secret = process.env.JWT_TEMP_SECRET_KEY;
  return jwt.verify(token, secret);
}

exports.registerStudent = async (req, res) => {
  try {
    const { name, email, password ,phone} = req.body;
    console.log("RegisterStudent body:", req.body);

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const exists = await RegisterStudent.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 5 * 60 * 1000;

    const payload = {
      name,
      email,
      password,
      otp,
      otpExpires,
      phone
    };

    const tempToken = createTempToken(payload);

    const subject = "🔐 Verify Your Email - NeetPeak";

const message = `
Hi ${name},

Welcome to NeetPeak! 🎉

Thank you for joining NeetPeak, the dedicated learning platform for NEET aspirants.  
We’re excited to help you on your journey toward cracking NEET with the right tools, guidance, and resources.  

Please use the following One-Time Password (OTP) to complete your signup:

🔑 OTP: ${otp}

This OTP is valid for the next 5 minutes.

If you didn’t request this, please ignore this email.

Best regards,  
Team NeetPeak  
📧 support@neetpeak.com
`;

const html = `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2>Hello ${name}, 👋</h2>
    <p>Welcome to <strong>NeetPeak</strong> — a platform designed specially for <strong>NEET aspirants</strong> like you!</p>
    <p>To verify your email and get started, please use the OTP below:</p>
    <h1 style="background: #f0f0f0; padding: 12px 20px; display: inline-block; border-radius: 8px;">${otp}</h1>
    <p>This OTP is valid for <strong>5 minutes</strong>.</p>
    <p>If you didn’t initiate this request, kindly ignore this email.</p>
    <hr />
    <p style="font-size: 0.9rem;">
      Need help? Contact us at 
      <a href="mailto:support@neetpeak.com">support@neetpeak.com</a>
    </p>
  </div>
`;

    try {
      await sendEmail(email, subject, message.trim(), html);
    } catch (err) {
      console.error("Error sending email:", err.message || err);
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully.",
      tempToken,

    });
  } catch (err) {
    console.error("registerStudent error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.verifyStudentOTP = async (req, res) => {
  try {
    const { otp, tempToken } = req.body;

    if (!otp || !tempToken) {
      return res.status(400).json({ message: "OTP and token are required." });
    }
    const decoded = verifyTempToken(tempToken);

    if (decoded.otp !== otp || Date.now() > decoded.otpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const exists = await RegisterStudent.findOne({ email: decoded.email });
    if (exists) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const student = new RegisterStudent({
      name: decoded.name,
      email: decoded.email,
       mobile:decoded.phone,
      password: decoded.password,
      otp: decoded.otp,
      otpExpires: decoded.otpExpires,
    });

    await student.save();

    const token = jwt.sign(
      { studentId: student._id, email: student.email },
      process.env.JWT_TEMP_SECRET_KEY,
      { expiresIn: "1h" }
    );
const subject = "🎉 Welcome to NeetPeak!";
const plainText = `
Hi ${decoded.name},

Congratulations! 🎓

You have successfully registered with NeetPeak.

We're excited to have you onboard. Get ready to focus on your NEET preparation, track your progress, and boost your learning with us.

You can now log in and start your NEET journey today!

If you have any questions or need support, feel free to reach out to us at support@neetpeak.com

Best regards,
Team NeetPeak
`;

const html = `
  <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
    <h2 style="color: #2d89ef;">🎉 Welcome to <span style="color: #ff5733;">NeetPeak</span>, ${decoded.name}!</h2>
    <p>We're thrilled to have you join our community of future doctors. 🚀</p>
    <p>You have <strong>successfully registered</strong> and can now focus on NEET preparation, practice questions, and track your progress with us.</p>
    <a href="https://neetpeak.com/login" style="display:inline-block; padding: 12px 20px; background-color: #2d89ef; color: #fff; border-radius: 5px; text-decoration: none; margin: 20px 0;">Start Learning</a>
    <p>If you ever need help, feel free to contact us at <a href="mailto:support@neetpeak.com">support@neetpeak.com</a></p>
    <hr style="margin: 30px 0;">
    <p style="font-size: 0.9rem; color: #777;">This email was sent by NeetPeak | Focused Learning for NEET Aspirants</p>
  </div>
`;


    try {
      await sendEmail(decoded.email, subject, plainText.trim(), html);
    } catch (emailErr) {
      console.error(
        "Error sending welcome email:",
        emailErr.message || emailErr
      );
    }

    return res.status(200).json({
      success: true,
      message: "Registration successful.",
      token,
   
    });
  } catch (err) {
    console.error("verifyStudentOTP error:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error.", error: err.message });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { name, email, password ,phone} = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await RegisterStudent.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 5 * 60 * 1000;

    const payload = {
      name,
      email,
      password,
      otp,
      otpExpires,
      phone
    };

    const tempToken = jwt.sign(payload, process.env.JWT_TEMP_SECRET_KEY, {
      expiresIn: "5m",
    });

   
    const subject = "🔐 Verify Your Email - NeetPeak";

const message = `
Hi ${name},

Welcome to NeetPeak! 🎉

Thank you for joining NeetPeak, the dedicated learning platform for NEET aspirants.  
We’re excited to help you on your journey toward cracking NEET with the right tools, guidance, and resources.  

Please use the following One-Time Password (OTP) to complete your signup:

🔑 OTP: ${otp}

This OTP is valid for the next 5 minutes.

If you didn’t request this, please ignore this email.

Best regards,  
Team NeetPeak  
📧 support@neetpeak.com
`;

const html = `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2>Hello ${name}, 👋</h2>
    <p>Welcome to <strong>NeetPeak</strong> — a platform designed specially for <strong>NEET aspirants</strong> like you!</p>
    <p>To verify your email and get started, please use the OTP below:</p>
    <h1 style="background: #f0f0f0; padding: 12px 20px; display: inline-block; border-radius: 8px;">${otp}</h1>
    <p>This OTP is valid for <strong>5 minutes</strong>.</p>
    <p>If you didn’t initiate this request, kindly ignore this email.</p>
    <hr />
    <p style="font-size: 0.9rem;">
      Need help? Contact us at 
      <a href="mailto:support@neetpeak.com">support@neetpeak.com</a>
    </p>
  </div>
`;

    try {
      await sendEmail(email, subject, message.trim(), html);
    } catch (err) {
      console.error("Error sending email:", err.message || err);
    }


    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      tempToken,
      
    });
  } catch (err) {
    console.error("resendOTP error:", err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getStudentData = async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameter: studentId",
      });
    }

    const student = await RegisterStudent.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        student,
      },
    });
  } catch (err) {
    console.error("Error fetching student data:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { _id, phone, ...updateFields } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        message: "Missing student ID",
      });
    }

    if (!updateFields.name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (phone) {
      const existingUser = await RegisterStudent.findOne({
        phone: phone,
        _id: { $ne: _id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "This phone number is already in use by another account",
        });
      }

      updateFields.phone = phone;
    }

    const updatedStudent = await RegisterStudent.findByIdAndUpdate(
      _id,
      updateFields,
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: updatedStudent,
    });
  } catch (err) {
    console.error("Error updating student:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.uploadProfilePicture = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing student ID" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const student = await RegisterStudent.findById(studentId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const result = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      "image"
    );

    student.profilePicture = result.secure_url;
    await student.save();

    return res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      imageUrl: result.secure_url,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

exports.studentForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: " Email is required" });
    }

    let student = await RegisterStudent.findOne({ email });

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const otp = generateOTP();
    const payload = {
      email,
      otp,
    };

    const token = createTempToken(payload);

   const subject = "🔑 Reset Your Password - NEETPeak";

const message = `
Hi ${student.name},

We received a request to reset your password for your NEETPeak account.

Please use the following One-Time Password (OTP) to reset your password:

🔐 OTP: ${otp}

This OTP is valid for the next 5 minutes.

If you did not request a password reset, please ignore this email.

Best regards,  
Team NEETPeak  
📧 support@neetpeak.com
`;

const html = `
  <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <h2>Hello ${student.name}, 👋</h2>
    <p>We received a request to <strong>reset your password</strong> for your <strong>NEETPeak</strong> account.</p>
    
    <p>Use the following One-Time Password (OTP) to proceed with resetting your password:</p>
    
    <h1 style="background: #f0f0f0; padding: 12px 24px; display: inline-block; border-radius: 8px; letter-spacing: 2px;">
      ${otp}
    </h1>
    
    <p style="margin-top: 15px;">This OTP is valid for <strong>5 minutes</strong>.</p>
    
    <hr style="margin: 20px 0;" />
    
    <p style="font-size: 0.9rem; color: #555;">
      If you did not request this, please ignore this email.  
      <br />
      Need help? Contact us at 
      <a href="mailto:support@neetpeak.com" style="color: #3B5A94; text-decoration: none;">support@neetpeak.com</a>
    </p>
  </div>
`;


    try {
      await sendEmail(student.email, subject, message.trim(), html);
    } catch (emailErr) {
      console.error("Error sending OTP email:", emailErr.message || emailErr);
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        token,
        otp,
      },
    });
  } catch (err) {
    console.error("Error in studentForgotPassword:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
exports.verifyForgotPasswordtOTP = async (req, res) => {
  try {
    const { token, otp: userOtp } = req.body;

    if (!token || !userOtp) {
      return res
        .status(400)
        .json({ success: false, message: "Token and OTP are required" });
    }

    const decoded = verifyTempToken(token);

    if (decoded.otp !== userOtp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      email: decoded.email,
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    return res
      .status(401)
      .json({ success: false, message: "OTP expired or invalid" });
  }
};

exports.updateForgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
   

    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // explicitly include password
    const student = await RegisterStudent.findOne({ email }).select("+password");

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    student.password = newPassword; 
    await student.save();

    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};


exports.logoutStudent = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(400).json({ message: "Token is required." });

    const deleted = await Session.findOneAndDelete({ token });
    if (!deleted)
      return res.status(404).json({ message: "Session not found." });

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.getStudents = async (req, res) => {
  try {
    const students = await RegisterStudent.find();
    return res.status(200).json({
      success: true,
      data: students,
      message: "Students fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch students",
    });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.body;

    // 1. Check valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    // 2. Find student
    const student = await RegisterStudent.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 3. Check if student has purchased courses
    const purchasedCourses = await PurchasedCourse.find({ student: studentId });

    if (purchasedCourses.length > 0) {
      // Delete purchased courses
      await PurchasedCourse.deleteMany({ student: studentId });

      // Delete course progress
      await CourseProgress.deleteMany({ student: studentId });
    }

    // 4. Delete student finally
    await RegisterStudent.findByIdAndDelete(studentId);

    return res.status(200).json({
      message: "Student deleted successfully",
      deletedStudentId: studentId,
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.getPaidStudents = async (req, res) => {
  try {
    console.log("we are paid students ");

    const mentorshipPayments = await PurchasedMentorship.find()
      .populate("student", "name email mobile")
      .populate("plan", "planName price") 
      .lean();

  
    const productOrders = await Order.find({ status: "paid" })
      .populate("userId", "name email mobile")
      .populate("productId", "title price")
      .lean();

    const studentMap = {};

 
    mentorshipPayments.forEach((m) => {
      const studentId = m.student._id;
      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          student: {
            name: m.student.name,
            email: m.student.email,
            mobile: m.student.mobile,
          },
          purchases: [],
          totalAmount: 0,
        };
      }

      studentMap[studentId].purchases.push({
        type: "MentorshipPlan",
        title: m.plan?.planName || "N/A", 
      });

      studentMap[studentId].totalAmount += m.pricePaid || 0;
    });


    productOrders.forEach((o) => {
      const studentId = o.userId._id;
      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          student: {
            name: o.userId.name,
            email: o.userId.email,
            mobile: o.userId.mobile,
          },
          purchases: [],
          totalAmount: 0,
        };
      }

      studentMap[studentId].purchases.push({
        type: "Product",
        title: o.productId?.title || "N/A",
      });

      studentMap[studentId].totalAmount += o.amount / 100;
    });

    const result = Object.values(studentMap);
    console.log(result);

    res.status(200).json({
      success: true,
      totalPaidStudents: result.length,
      data: result,
    });
  } catch (err) {
    console.error("Error fetching paid students:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching paid students",
    });
  }
};
