const Order = require("../../Models/Product/orderModel");
const PurchasedMentorship = require("../../Models/Mentroship/purchasementorshipPlanModel");
const RegisterStudent = require("../../Models/Student/registerStudentModel");

exports.getRevenueAnalytics = async (req, res) => {
  try {
    let { months } = req.query;
    months = parseInt(months) || 6; 

    if (months <= 0 || months > 24) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid months range" });
    }
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (months - 1));
    startDate.setDate(1); 

    const orderRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: "paid",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: { $divide: ["$amount", 100] } }, 
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const mentorshipRevenue = await PurchasedMentorship.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: "active",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$pricePaid" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    const revenueMap = new Map();
    [...orderRevenue, ...mentorshipRevenue].forEach((entry) => {
      const key = `${entry._id.year}-${entry._id.month}`;
      revenueMap.set(key, (revenueMap.get(key) || 0) + entry.total);
    });
    const results = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      results.push({
        month: d.toLocaleString("default", { month: "short" }),
        year: d.getFullYear(),
        revenue: Math.round((revenueMap.get(key) || 0) * 100) / 100,
      });
    }
    const totalOrderRevenueAgg = await Order.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: { $divide: ["$amount", 100] } } } },
    ]);

    const totalMentorshipRevenueAgg = await PurchasedMentorship.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: null, total: { $sum: "$pricePaid" } } },
    ]);

    const totalRevenue =
      (totalOrderRevenueAgg[0]?.total || 0) +
      (totalMentorshipRevenueAgg[0]?.total || 0);

    const totalProducts = await Order.countDocuments({ status: "paid" });
    res.json({
      success: true,
      data: results,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalProducts,
    });
  } catch (err) {
    console.error("Revenue Analytics Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.getUserAnalytics = async (req, res) => {
  try {
    let { months } = req.query;
    months = parseInt(months) || 6;

    if (months <= 0 || months > 12) {
      return res.status(400).json({ success: false, message: "Invalid months range" });
    }

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1); 
    const userSignups = await RegisterStudent.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          total: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

   
    const results = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthData = userSignups.find(
        (u) => u._id.year === d.getFullYear() && u._id.month === d.getMonth() + 1
      );
      results.push({
        month: d.toLocaleString("default", { month: "short" }),
        year: d.getFullYear(),
        totalUsers: monthData ? monthData.total : 0,
      });
    }

    const totalSignups = results.reduce((sum, r) => sum + r.totalUsers, 0);
 

    res.json({ success: true, data: results, totalSignups });
  } catch (err) {
    console.error("User Analytics Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
