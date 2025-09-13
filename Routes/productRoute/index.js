 const express = require('express');
const router = express.Router();

const ManageProduct = require('./manageProduct.route');

router.use('/ManageProduct', ManageProduct);


module.exports = router;
