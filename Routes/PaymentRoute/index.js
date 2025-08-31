const express = require('express');
const router = express.Router();

const  ManagePayment= require('./payment.route');
router.use('/ManagePayment', ManagePayment);

module.exports = router;