  const express = require("express");
 const router = express.Router();
 const { ROLE_GROUPS } = require("../../config/roles");
 const ManagePaymentController = require("../../Controllers/PaymentController/manageProductPayment")
 const { verifyToken, requireRole } = require("../../Middleware/authMiddleware");
 router.post('/createProductOrder',ManagePaymentController.createOrder)
 router.post('/verifyProductPayment',ManagePaymentController.verifyPayment)

 module.exports = router
 