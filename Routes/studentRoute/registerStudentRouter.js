const express = require('express');
const router = express.Router();
const SignupStudentController  = require('../../Controllers/StudentController/SignupStudentcontroller');
 const { uploadXLS,uploadImage,uploadImagesArray} = require('../../Middleware/upload');

router.post('/DirectStduentRegister',SignupStudentController.registerStudent)
router.post('/DirectStudentLogin',SignupStudentController.loginStudent)
router.post('/Verify-otp',SignupStudentController.verifyStudentOTP)
router.post('/Resend-otp',SignupStudentController.resendOTP)
router.get('/getStudentData',SignupStudentController.getStudentData)
router.get('/getstudents',SignupStudentController.getStudents)
router.post('/updateStudentData',SignupStudentController.updateStudent)
router.post('/upload-profile-image',uploadImage.single('image'),SignupStudentController.uploadProfilePicture)

router.post('/forgotPassword',SignupStudentController.studentForgotPassword )
router.post('/Verify-forgotPassword-Otp',SignupStudentController.verifyForgotPasswordtOTP)
router.post('/Update-forgotPassword',SignupStudentController.updateForgotPassword)
router.delete('/deleteStudent',SignupStudentController.deleteStudent)
router.get("/paidStudentdata",SignupStudentController.getPaidStudents)


module.exports = router


