const mongoose = require('mongoose');

const purchasedCourseSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RegisterStudent',
    required: true,
    index: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true,
  },
  pricePaid: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentId: {
    type: String, // Razorpay payment ID
    required: true,
    unique: true, // Ensure uniqueness
  },
  orderId: {
    type: String, // Razorpay order ID
    required: true,
    unique: true,
  },
  promoCode: {
    type: String,
    default: null,
  },
  validityEndDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'refunded'],
    default: 'active',
  },
}, {
  timestamps: true,
});

purchasedCourseSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('PurchasedCourse', purchasedCourseSchema);
