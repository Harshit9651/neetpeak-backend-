// controllers/mentorship.controller.js
const  MentorshipPlan = require("../../models/Mentroship/mentorshipModel");


 exports.createMentorshipPlan = async (req, res) => {
  try {
    console.log("hii")
    const { planName, duration, description, features, price, mrp } = req.body;
    console.log(planName, duration, description, features, price, mrp )
    console.log("hii2")

    // Validation
    if (!planName || !duration || !price || !mrp) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }
    console.log("hii3")

    if (Number(price) > Number(mrp)) {
      return res.status(400).json({ success: false, message: "Price cannot be higher than MRP" });
    }

    const newPlan = new MentorshipPlan({
      planName,
      duration,
      description,
      features,
      price,
      mrp,
    });

  const NewMentorshipPlan =   await newPlan.save();
  console.log(NewMentorshipPlan)

    res.status(201).json({
      success: true,
      message: "Mentorship plan created successfully",
      data: newPlan,
    });
  } catch (error) {
    console.error("Mentorship Plan Create Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

 exports.getAllMentorshipPlans = async (req, res) => {
  try {
    const plans = await MentorshipPlan.find({ }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


 exports.deleteMentorshipPlan = async (req, res) => {
  try {
    console.log("hii")
    const deleted = await MentorshipPlan.findByIdAndDelete(req.params.planId);
console.log(deleted)
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }
    res.status(200).json({ success: true, message: "Plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Toggle Mentorship Plan Status
exports.updateMentorshipPlanStatus = async (req, res) => {
  try {
    console.log("hji")
    const { planId } = req.params;
    const { newstatus } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required",
      });
    }

    if (typeof newstatus !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "newstatus must be true or false",
      });
    }

    const updatedPlan = await MentorshipPlan.findByIdAndUpdate(
      planId,
      { isActive: newstatus },
      { new: true } // return updated document
    );

    if (!updatedPlan) {
      return res.status(404).json({
        success: false,
        message: "Mentorship plan not found",
      });
    }
    console.log("plan updated :", updatedPlan)

    res.status(200).json({
      success: true,
      message: `Mentorship plan status updated to ${newstatus ? "Active" : "Inactive"}`,
      data: updatedPlan,
    });
  } catch (error) {
    console.error("Toggle Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
 

// const getMentorshipPlanById = async (req, res) => {
//   try {
//     const plan = await MentorshipPlan.findById(req.params.id);
//     if (!plan) {
//       return res.status(404).json({ success: false, message: "Plan not found" });
//     }
//     res.status(200).json({ success: true, data: plan });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };

// const updateMentorshipPlan = async (req, res) => {
//   try {
//     const { price, mrp } = req.body;
//     if (price && mrp && Number(price) > Number(mrp)) {
//       return res.status(400).json({ success: false, message: "Price cannot be higher than MRP" });
//     }

//     const updatedPlan = await MentorshipPlan.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     if (!updatedPlan) {
//       return res.status(404).json({ success: false, message: "Plan not found" });
//     }

//     res.status(200).json({ success: true, message: "Plan updated successfully", data: updatedPlan });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// };
