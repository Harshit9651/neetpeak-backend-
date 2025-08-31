const express = require('express');
const router = express.Router();

const registerStudentRoutes = require('./registerStudentRouter');

router.use('/student', registerStudentRoutes);


module.exports = router;
