 const express = require('express');
const router = express.Router();

const ManageMentorshipCallBook = require('./mentorshipCallBook.route');

router.use('/ManageMentorshipCallBook', ManageMentorshipCallBook);


module.exports = router;
