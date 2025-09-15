
const cron = require("node-cron");
const RegisterStudent = require("../Models/Student/registerStudentModel");

cron.schedule("*/1 * * * *", async () => {
  try {
    const now = new Date();
    await RegisterStudent.updateMany(
      { otpExpires: { $lt: now } },
      { $unset: { otp: "", otpExpires: "" } }
    );
  } catch (error) {
   console.error(" Cron job error:", error.message);
  }
});
