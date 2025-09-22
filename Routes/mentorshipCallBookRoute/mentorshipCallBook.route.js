 const express = require("express");
const router = express.Router();
const { ROLE_GROUPS } = require("../../config/roles");
const ManageMentorshipCallBookController = require("../../Controllers/PaymentController/mentorshipCallBookPayment")
const { verifyToken, requireRole } = require("../../Middleware/authMiddleware");
router.post('/createOrder',ManageMentorshipCallBookController.createCallOrder)
router.post('/verifyPayment',ManageMentorshipCallBookController.verifyCallPayment)
router.get('/getAllBookedCalls',ManageMentorshipCallBookController.getAllMentorshipCalls)

module.exports = router
