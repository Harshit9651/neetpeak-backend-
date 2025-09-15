 const express = require("express");
const router = express.Router();
const { ROLE_GROUPS } = require("../../config/roles");
const ManagePaymentController = require("../../Controllers/PaymentController/managePayment")
const { verifyToken, requireRole } = require("../../Middleware/authMiddleware");
router.post('/createOrder',ManagePaymentController.createOrder)
router.post('/verifyPayment',ManagePaymentController.verifyPayment)
router.get('/purchasedMentorshipPlans',ManagePaymentController.getAllPurchasedMentorships)

module.exports = router
