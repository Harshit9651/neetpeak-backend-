 const express = require("express");
 const router = express.Router();
 const { ROLE_GROUPS } = require("../../config/roles");
 const MentorshipController= require("../../Controllers/MentorshipController/manageMentorship")
 const { verifyToken, requireRole } = require("../../Middleware/authMiddleware");
  const { uploadImage,uploadVideoAndThumbnail,uploadVideo} = require('../../Middleware/upload');
 
 router.post('/addMentorshipPlan',MentorshipController.createMentorshipPlan)
 router.get('/getMentorshipPlan',MentorshipController.getAllMentorshipPlans)
 router.delete('/deleteMentorshipPlan/:planId',MentorshipController.deleteMentorshipPlan)
 router.put('/updateMentorshipPlanstatus/:planId',MentorshipController.updateMentorshipPlanStatus)

 module.exports = router
 
 
 
 