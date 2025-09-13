const PromoCode = require("../../Models/Course/promocode");
const Student = require("../../Models/Student/registerStudentModel");
const Product = require("../../Models//Product/productModel");

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
    console.log("Creating promo code with data:", data);

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
      applicableProducts: data.applicableCourses,
      usageLimit: data.usageLimit,
      usedCount: 0,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: data.isActive,
    });

    const savedPromoCode = await promoCode.save();
    console.log("Created promo code:", savedPromoCode);
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
    console.log("Updating promo code with data:", data);

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
       applicableProducts: data.applicableCourses,
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
      path: "applicableProducts",
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
    const { code, productId, studentId,quantity} = req.body; 
    console.log(code,productId,studentId,quantity)
if (!quantity || quantity <= 0) {
  quantity = 1;
}

    if (!code || !productId || !studentId ) {
      return res.status(400).json({
        success: false,
        message: "Code, productId, and studentId are required.", 
      });
    }
    console.log("hii")

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Invalid student.",
      });
    }
    console.log("hii the student is :",student)

    const promo = await PromoCode.findOne({ code });
    if (!promo || !promo.isActive) {
      return res.status(404).json({
        success: false,
        message: "Promo code is invalid or inactive.",
      });
    }
console.log("hii promo code is :", promo)
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Promo code has expired.",
      });
    }
console.log("hii2")
    if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "Promo code usage limit reached.",
      });
    }
console.log("hii3")
    if (promo.usedBy?.some((id) => id.toString() === studentId)) {
      return res.status(400).json({
        success: false,
        message: "You have already used this promo code.",
      });
    }
console.log("hii4")
    const isApplicable = promo.applicableProducts.some(
      (id) => id.toString() === productId
    );
    console.log("is applicable:",isApplicable )

    if (!isApplicable) {
      return res.status(400).json({
        success: false,
        message: "Promo code not applicable for this product.", 
      });
    }

    const product = await Product.findById(productId); 
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const discountPercent = promo.discountValue;
    const productTotalPrice = product.price*quantity
    const discountAmount = Math.round((productTotalPrice* discountPercent) / 100);
    const finalPrice = productTotalPrice- discountAmount;
    console.log("discountPercent",discountPercent)
    console.log("discount amount :", discountAmount)
    console.log("final price :", finalPrice)

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