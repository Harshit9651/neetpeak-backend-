 const express = require('express');
const router = express.Router();

const  ManageCart= require('./managecart.route');
router.use('/ManageCart',ManageCart);

module.exports = router;