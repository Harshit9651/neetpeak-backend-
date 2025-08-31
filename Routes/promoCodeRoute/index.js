const express = require('express');
const router = express.Router();

const  ManagePromoCode= require('./managePromocode.Route');
router.use('/ManagePromocode', ManagePromoCode);

module.exports = router;