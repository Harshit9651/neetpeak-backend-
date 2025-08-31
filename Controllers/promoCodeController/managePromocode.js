const PromoCode = require("../../Models/Course/promocode");
const Course = require("../../Models/Course/createCourse");
const Student = require("../../Models/Student/registerStudentModel");

const validatePromoFields = (data) => {
  const errors = [];

  if (!data.code || typeof data.code !== "string") {
    errors.push("Promo code is required and must be a string.");
  }

  if (
    !data.discountType ||
    !["percentage", "flat"].includes(data.discountType)
  ) {
    errors.push('Discount type must be either "percentage" or "flat".');
  }

  if (typeof data.discountValue !== "number" || isNaN(data.discountValue)) {
    errors.push("Discount value must be a valid number.");
  }

  if (!Array.isArray(data.applicableCourses)) {
    errors.push("Applicable courses must be an array of course IDs.");
  }

  if (typeof data.usageLimit !== "number" || isNaN(data.usageLimit)) {
    errors.push("Usage limit must be a valid number.");
  }

  if (data.expiresAt && isNaN(Date.parse(data.expiresAt))) {
    errors.push("Invalid expiry date.");
  }

  if (typeof data.isActive !== "boolean") {
    errors.push("isActive must be a boolean.");
  }

  return errors;
};

exports.createPromoCode = async (req, res) => {
  try {
    const data = req.body;

    const errors = validatePromoFields(data);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const existing = await PromoCode.findOne({ code: data.code });
    if (existing) {
      return res.status(400).json({ message: "Promo code already exists." });
    }
  
    const promoCode = new PromoCode({
      code: data.code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      applicableCourses: data.applicableCourses,
      usageLimit: data.usageLimit,
      usedCount: 0,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive,
    });

    const savedPromoCode = await promoCode.save();
    return res
      .status(201)
      .json({ message: "Promo code created successfully.", promoCode });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updatePromoCode = async (req, res) => {
  try {
    const promoId = req.params.id;
    const data = req.body;

    const errors = validatePromoFields(data);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    const updatedPromo = await PromoCode.findByIdAndUpdate(
      promoId,
      {
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        applicableCourses: data.applicableCourses,
        usageLimit: data.usageLimit,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedPromo) {
      return res.status(404).json({ message: "Promo code not found." });
    }

    return res.status(200).json({
      message: "Promo code updated successfully.",
      promoCode: updatedPromo,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getAllPromoCodes = async (req, res) => {
  try {
    const promoCodes = await PromoCode.find({}).populate({
      path: "applicableCourses",
      select: "_id title",
    });
    if (!promoCodes || promoCodes.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No promo codes found.",
        promoCodes: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Promo codes retrieved successfully.",
      promoCodes,
    });
  } catch (err) {
    console.error("Error fetching promo codes:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.updatePromoCode = async (req, res) => {
  try {
    const promoId = req.params.id;
    const data = req.body;

    const errors = validatePromoFields(data);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const updatedPromo = await PromoCode.findByIdAndUpdate(
      promoId,
      {
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        applicableCourses: data.applicableCourses,
        usageLimit: data.usageLimit,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedPromo) {
      return res.status(404).json({ message: "Promo code not found." });
    }
    console.log("Promo code updated:", updatedPromo);
    return res.status(200).json({
      message: "Promo code updated successfully.",
      promoCode: updatedPromo,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.deletePromoCode = async (req, res) => {
  try {
    const promoId = req.params.id;

    const deletedPromo = await PromoCode.findByIdAndDelete(promoId);
    if (!deletedPromo) {
      return res.status(404).json({ message: "Promo code not found." });
    }

    return res
      .status(200)
      .json({ message: "Promo code deleted successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.validatePromoCode = async (req, res) => {
  try {
    console.log("Validating promo code...");
    const { code, courseId, studentId } = req.body;
  

    if (!code || !courseId || !studentId) {
      return res.status(400).json({
        success: false,
        message: "Code, courseId, and studentId are required.",
      });
    }
  

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Invalid student.",
      });
    }
 
    const promo = await PromoCode.findOne({ code });
    if (!promo || !promo.isActive) {
      return res.status(404).json({
        success: false,
        message: "Promo code is invalid or inactive.",
      });
    }


    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Promo code has expired.",
      });
    }
  

    if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "Promo code usage limit reached.",
      });
    }
    if (promo.usedBy?.some((id) => id.toString() === studentId)) {
      return res.status(400).json({
        success: false,
        message: "You have already used this promo code.",
      });
    }

    const isApplicable = promo.applicableCourses.some(
      (id) => id.toString() === courseId
    );

    if (!isApplicable) {
      return res.status(400).json({
        success: false,
        message: "Promo code not applicable for this course.",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }
    const discountPercent = promo.discountValue;
    const discountAmount = Math.round((course.price * discountPercent) / 100);
    const finalPrice = course.price - discountAmount;

    return res.status(200).json({
      success: true,
      message: "Promo applied successfully.",
      discountPercent,
      discountAmount,
      finalPrice,
    });
  } catch (err) {
    console.error("Error validating promo:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};