const mongoose = require('mongoose');

const mentorshipCallSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RegisterStudent",
      required: true,
    },
 
    // callDate: {
    //   type: Date,
    //   required: true,
    // },
  
    price: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "unpaid", "pending", "failed"],
      default: "pending",
    },
    orderId: {
      type: String, // payment gateway ka order id
      required: false,
    },
    paymentId: {
      type: String, // payment gateway ka payment id
      required: false,
    },
 

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
  },
  {
    timestamps: true, 
  }
);

// Optional: index to easily find upcoming calls
mentorshipCallSchema.index({ student: 1, callDate: 1 });

const MentorshipCall =
  mongoose.models.MentorshipCall ||
  mongoose.model("MentorshipCall", mentorshipCallSchema);

module.exports = MentorshipCall;
 