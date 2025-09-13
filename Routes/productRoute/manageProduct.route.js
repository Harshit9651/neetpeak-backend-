 const express = require("express");
 const router = express.Router();
 const { ROLE_GROUPS } = require("../../config/roles");
 const ProductController = require("../../Controllers/ProductController/productController")
 const { verifyToken, requireRole } = require("../../Middleware/authMiddleware");
  const { uploadImage,uploadVideoAndThumbnail,uploadVideo} = require('../../Middleware/upload');
 
 router.post('/addProduct',uploadImage.single('image'),ProductController.addProduct)
 router.get('/getProducts',ProductController.listProducts)
 router.get('/getProductsforPromocode',ProductController.listProductsForPrmocode)
 router.delete('/deleteProduct/:productId', verifyToken, ProductController.deleteProduct);
 router.put('/updateStockStatus/:productId', verifyToken, ProductController.updateProductStockStatus);
 router.post('/updateProduct',uploadImage.single('image'),ProductController.updateProduct)
 
 
 
 
 
 module.exports = router;