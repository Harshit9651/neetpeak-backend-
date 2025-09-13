 const express = require('express');
const router = express.Router();

const ManageMentorship = require('./manageMentorship.route');

router.use('/ManageMentorship', ManageMentorship);


module.exports = router;
