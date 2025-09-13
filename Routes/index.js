const express = require("express");
const router = express.Router();

router.use("/admin", require("./adminRoute"));
router.use("/student", require("./studentRoute"));
router.use("/courses", require("./courseRoute"));
router.use("/PromoCode", require("./promoCodeRoute"));
router.use("/Payment", require("./PaymentRoute"));
router.use("/Cart", require("./cartRoute"));
router.use("/Product", require("./productRoute"));
router.use("/Mentorship",require("./mentorshipRoute"))

module.exports = router;
