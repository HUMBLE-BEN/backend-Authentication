const dotenv = require('dotenv');
dotenv.config();

const ENV = {
    port: process.env.PORT || 3000,
    mongoUrl: process.env.MONGODB_URL,
    brevoApiKey: process.env.BREVO_API_KEY,
    brevoSenderEmail: process.env.BREVO_SENDER_EMAIL,
    brevoSenderName: process.env.BREVO_SENDER_NAME ? process.env.BREVO_SENDER_NAME.replace(/"/g, '') : "Events Market place",
    otpExpireTime: parseInt(process.env.OTP_EXPIRESAT_TIME || process.env.OTP_EXPIRE_TIME || "10", 10),
    otpResendCoolDown: parseInt(process.env.OTP_RESEND_COOLDOWN || 10),
    otpMaxAttempt: parseInt(process.env.OTP_MAX_ATTEMPTS || 10),
    jwtSecret: process.env.JWT_SECRET || "secret_key_weekendclass7",
};

module.exports = ENV;
