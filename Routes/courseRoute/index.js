const express = require('express');
const router = express.Router();

const  ManageCourseAndVideos= require('./manageCourseAndVideos.route');
router.use('/ManageCourses', ManageCourseAndVideos);

module.exports = router;