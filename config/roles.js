const ROLES = {
  SUPER_ADMIN: "superadmin",
  ADMIN: "admin",
  HR: "hr",
  TECH: "tech",
  CONTENT: "content",
  MARKETING: "marketing",
  DIRECT_STUDENT: "directStudent",
  COLLEGE_STUDENT: "collegeStudent",
  COLLEGE_ADMIN: "collegeAdmin",
};

const ROLE_GROUPS = {
  superAdminOnly: [ROLES.SUPER_ADMIN],
  adminOnly: [ROLES.ADMIN],
  adminAndSuperAdmin: [ROLES.ADMIN, ROLES.SUPER_ADMIN,ROLES.TECH],
  contentTeam: [ROLES.CONTENT, ROLES.MARKETING],
  techTeam: [ROLES.TECH],
  studentRoles: [ROLES.DIRECT_STUDENT, ROLES.COLLEGE_STUDENT],
    contentAndSuperAdmin: [ROLES.SUPER_ADMIN, ROLES.CONTENT],
  managementRoles: [
    ROLES.HR,
    ROLES.ADMIN,
    ROLES.SUPER_ADMIN,
     ROLES.CONTENT,
 
  ],
  allUsers: Object.values(ROLES),
};

module.exports = {
  ROLES,
  ROLE_GROUPS,
};
