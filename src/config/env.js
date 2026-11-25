const dotenv = require('dotenv');
dotenv.config();

const ENV = {
    port: process.env.PORT || 3000,
    mongoUrl: process.env.MONGODB_URL,
    brevoApiKey: process.env.BREVO_API_KEY,
    brevoSenderEmail: process.env.BREVO_SENDER_EMAIL,
    brevoSenderName: process.env.BREVO_SENDER_NAME ? process.env.BREVO_SENDER_NAME.replace(/"/g, '') : "Events Market place",
    otpExpireTime: parseInt(process.env.OTP_EXPIRESAT_TIME || "10", 10),
    otpResendCoolDown: parseInt(process.env.OTP_RESEND_COOLDOWN || 10),
    otpMaxAttempt: parseInt(process.env.OTP_MAX_ATTEMPTS || 10),



    jwt_access_secret: process.env.JWT_SECRET || "secret_key_weekendclass7",
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
    // jsonwebtoken accepts durations such as "15m" or numeric seconds.
    jwt_access_expires: (process.env.JWT_ACCESS_EXPIRES_IN || "15m").trim(),
    // Keep the refresh lifetime in days for the cookie maxAge calculation.
    refresh_token_expires: parseInt(
        (process.env.JWT_REFRESH_EXPIRES_IN || "30d").trim(),
        10
    ),








    node_evn: process.env.NODE_ENV || "development",
    cookie_secure: process.env.COOKIE_SECURE === "FALSE" ||
        process.env.NODE_ENV === "production",
    cookie_same_site: process.env.COOKIE_SAME_SITE || "lax",

};

module.exports = ENV;
