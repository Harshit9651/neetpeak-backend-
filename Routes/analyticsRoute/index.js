  const express = require('express');
const router = express.Router();

const  ManageAnalyticts= require('./analytics.route');
router.use('/ManageAnalyticts',ManageAnalyticts);

module.exports = router;