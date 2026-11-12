const ejs = require("ejs");
const path = require("node:path");
const ENV = require("../config/env");

const sendEmail = async ({ to, otp, purpose }) => {
    const isReset = purpose === "password_reset";
    const subject = isReset ? "Reset your password" : "Email verification";
    const message = isReset
        ? "Please use the code below to reset your password"
        : "Please use the code below to verify your email";

    const templatePath = path.join(__dirname, "../emails/otp.ejs");
    const html = await ejs.renderFile(templatePath, {
        title: subject,
        message,
        otp,
        expiresMinutes: ENV.otpExpireTime || 10
    });

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": ENV.brevoApiKey
        },
        body: JSON.stringify({
            sender: {
                email: ENV.brevoSenderEmail,
                name: ENV.brevoSenderName
            },
            to: [{ email: to }],
            subject,
            htmlContent: html
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("failed to send email", errorData);
        throw new Error(`failed to send email: ${errorData.message || response.statusText}`);
    }

    return response.json();
};

module.exports = {
    sendEmail,
    sendOtpEmail: sendEmail
};
