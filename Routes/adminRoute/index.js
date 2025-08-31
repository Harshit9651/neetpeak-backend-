const express = require('express');
const router = express.Router();

const adminauth = require('./adminauth.route');
router.use('/Auth_Admin', adminauth);


module.exports = router;
