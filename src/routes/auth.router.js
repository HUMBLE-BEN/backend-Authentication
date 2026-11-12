const express = require("express");
const validateBody = require("../middlewares/validation.middleware");
const { register, verifiedEmail, resendOtp, userLogin } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register_user", validateBody("register"), register);
router.post("/verified_email", validateBody("verifiedEmail"), verifiedEmail);
router.post("/resend_otp", validateBody("resendOtp"), resendOtp);
router.post("/user_login", validateBody("login"), userLogin);




module.exports = router;