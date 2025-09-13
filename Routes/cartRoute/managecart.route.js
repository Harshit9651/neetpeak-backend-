 const express = require("express");
const router = express.Router();
const Cartcontroller = require("../../Controllers/ProductController/cartController")


router.post('/addToCart',Cartcontroller.addToCart)
router.get('/getCart/:userId',Cartcontroller.getCart)
router.delete('/removeFromCart/:userId/:productId',Cartcontroller.removeFromCart)
router.put('/updateCart',Cartcontroller.updateCart)

module.exports = router;