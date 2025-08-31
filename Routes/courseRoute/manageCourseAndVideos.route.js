const express = require("express");
const router = express.Router();
const { ROLE_GROUPS } = require("../../config/roles");
const ManageCourseAndVideos = require("../../Controllers/CourseController/manageCourseAndVideosController")
const { verifyToken, requireRole } = require("../../Middleware/authMiddleware");
 const { uploadImage,uploadVideoAndThumbnail,uploadVideo} = require('../../Middleware/upload');

router.post('/addCourses',uploadImage.single('image'),ManageCourseAndVideos.addCourse)
router.post('/updateCourse',uploadImage.single('image'),ManageCourseAndVideos.updateCourse)
router.get('/getCourses',ManageCourseAndVideos.listCourses)
router.get('/listAllCourses', ManageCourseAndVideos.listAllCourses);
router.post('/uploadVideo', uploadVideoAndThumbnail, ManageCourseAndVideos.uploadCourseVideo);
router.put('/updateVideo/:videoId', uploadVideoAndThumbnail, ManageCourseAndVideos.updateCourseVideo);
router.delete('/deleteVideo/:videoId', ManageCourseAndVideos.deleteCourseVideo);
router.get('/getCourseVideos',ManageCourseAndVideos.getCourseVideos )
router.get('/getCoursePlayList',verifyToken, ManageCourseAndVideos.getCoursePlaylistsWithVideos);
router.post('/addPlaylist',uploadImage.single('image'), verifyToken, ManageCourseAndVideos.addplaylist);
router.post('/addVideoToPlaylist',uploadVideoAndThumbnail, ManageCourseAndVideos.uploadPlaylistVideo);
router.put('/updateStatusofPlayList',verifyToken,ManageCourseAndVideos.updateStatusOfPlaylist);
router.delete('/deletePlaylist/:playList_id', verifyToken, ManageCourseAndVideos.deletePlaylist);
router.post('/updatePlayList', uploadImage.single('image'), verifyToken, ManageCourseAndVideos.updatePlaylist);
router.delete('/deleteCourse/:courseId', verifyToken, ManageCourseAndVideos.deleteCourse);
router.put('/updateCourseStatus/:courseId', verifyToken, ManageCourseAndVideos.updateCourseStatus);
router.get('/getCourseDetails/:courseId', verifyToken, ManageCourseAndVideos.getCourseDetails);
router.get("/getCourseByStudentId/:studentId", ManageCourseAndVideos.getPurchasedCoursesByStudentId);
router.post('/markVideoasWatched', ManageCourseAndVideos.markVideoAsWatched)
router.get('/getStudentCoursesSummary/:studentId',ManageCourseAndVideos.getStudentCoursesSummary)
router.get('/progressDashboard/:studentId/course/:courseId',ManageCourseAndVideos.getCourseProgressDetails);





module.exports = router;