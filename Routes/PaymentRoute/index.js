const express = require('express');
const router = express.Router();

const  ManagePayment= require('./payment.route');
const ManageProductPayment = require('./productPayment.route')
router.use('/ManagePayment', ManagePayment);
router.use('/ManageProductPayment', ManageProductPayment)

module.exports = router;