const express = require("express");
const validateBody = require("../middlewares/validation.middleware");
const { authenticateToken } = require("../middlewares/auth.middleware")
const { register, verifiedEmail, resendOtp, userLogin, refreshAccessToken, logout, logoutAll, forgotPassword, resetPassword, } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register_user", validateBody("register"), register);
router.post("/verified_email", validateBody("verifiedEmail"), verifiedEmail);
router.post("/resend_otp", validateBody("resendOtp"), resendOtp);
router.post("/user_login", validateBody("login"), userLogin);
router.post("/refresh_token", refreshAccessToken)
router.post("/logout", logout)
router.post("/logout_all", authenticateToken, logoutAll),
    router.post("/forgot_password", forgotPassword),
    router.post("/reset_password", validateBody("resetPassword"), resetPassword),




    module.exports = router;