const express = require("express");
const router = express.Router();
const Admin = require('../../Controllers/AdminController/adminAuthController')
const { verifyToken,logout,requireRole} = require("../../Middleware/authMiddleware");
const{ ROLE_GROUPS } = require("../../config/roles")

router.post('/login',Admin.login)
router.post('/signup',verifyToken,requireRole(...ROLE_GROUPS.superAdminOnly),Admin.Usersignup )
router.get('/getUsers',verifyToken,requireRole(...ROLE_GROUPS.adminAndSuperAdmin),Admin.getAllUsers)
router.put('/editUser',verifyToken,requireRole(...ROLE_GROUPS.superAdminOnly),Admin.updateUser)
router.delete('/deleteUser',verifyToken,requireRole(...ROLE_GROUPS.superAdminOnly),Admin.deleteUser)
router.post('/sendUserQuaryToAdmin',Admin.sendUserQuaryToAdmin)
router.get('/getAllUserQuary',verifyToken,requireRole(...ROLE_GROUPS.superAdminOnly),Admin.getAllUserQuaries)
router.post('/logout', verifyToken, logout); 

module.exports = router