 const express = require("express");
const router = express.Router();
const { ROLE_GROUPS } = require("../../config/roles");
const managePromocodeController = require("../../Controllers/promoCodeController/managePromocode")
const { verifyToken, requireRole } = require("../../Middleware/authMiddleware");
 const { uploadImage,uploadVideoAndThumbnail,uploadVideo} = require('../../Middleware/upload');

router.post('/addPromoCode', verifyToken, managePromocodeController.createPromoCode);
router.get('/getPromoCodes', verifyToken, managePromocodeController.getAllPromoCodes);
router.put('/updatePromoCode/:id', verifyToken, managePromocodeController.updatePromoCode);
router.delete('/deletePromoCode/:id', verifyToken, managePromocodeController.deletePromoCode);
router.post('/validatePromoCode',managePromocodeController.validatePromoCode);

module.exports = router
