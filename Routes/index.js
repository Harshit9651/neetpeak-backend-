const express = require("express");
const router = express.Router();

router.use("/admin", require("./adminRoute"));
router.use("/student", require("./studentRoute"));
router.use("/courses", require("./courseRoute"));
router.use("/PromoCode", require("./promoCodeRoute"));
router.use("/Payment", require("./PaymentRoute"));

module.exports = router;
