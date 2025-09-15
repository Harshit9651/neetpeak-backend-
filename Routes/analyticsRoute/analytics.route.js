const express = require("express");
const router = express.Router();
const AnalyticsController= require("../../Controllers/AnalyticsController/analyticsController");

router.get("/revenueChart",AnalyticsController.getRevenueAnalytics);
router.get("/signupuserChart",AnalyticsController.getUserAnalytics)

module.exports = router; 