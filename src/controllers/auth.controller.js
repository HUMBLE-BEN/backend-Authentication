const ENV = require("../config/env.js");
const User = require("../models/auth.model.js");
const generateOtp = require("../utils/otp.util.js");
const { sendOtpEmail, sendEmail } = require("../utils/emailSetup.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
    try {
        const { userName, email, password, phoneNumber } = req.body;

        const existingUser = await User.findOne({
            $or: [{ email }, { phoneNumber }],
        });

        if (existingUser) {
            if (existingUser.isVerified) {
                return res.status(409).json({
                    success: false,
                    message: "email or phone number already exists",
                });
            }

            // unverified account: update details and resend OTP
            existingUser.password = await bcrypt.hash(password, 10);
            if (userName) existingUser.userName = userName;
            if (phoneNumber) existingUser.phoneNumber = phoneNumber;

            const plainOtp = generateOtp();
            existingUser.otp = plainOtp;
            existingUser.otpExpireAt = new Date(
                Date.now() + ENV.otpExpireTime * 60 * 1000
            );

            await existingUser.save();
            await sendOtpEmail({
                to: existingUser.email,
                otp: plainOtp,
                purpose: "email_verification",
            });

            return res.status(200).json({
                success: true,
                message: "unverified account found, OTP sent for verification",
                email: existingUser.email,
            });
        }

        // brand new user
        const hashPassword = await bcrypt.hash(password, 10);
        const plainOtp = generateOtp();

        const newUser = await User.create({
            userName,
            email,
            phoneNumber,
            password: hashPassword,
            otp: plainOtp,
            otpExpireAt: new Date(Date.now() + ENV.otpExpireTime * 60 * 1000),
            isVerified: false,
        });

        await sendOtpEmail({
            to: newUser.email,
            otp: plainOtp,
            purpose: "email_verification",
        });

        return res.status(201).json({
            success: true,
            message: "account created, OTP sent to verify your email",
            email: newUser.email,
        });
    } catch (error) {
        console.error("[registerController] error:", error.message);
        return res.status(500).json({
            success: false,
            message: "registration failed",
        });
    }
};



const verifiedEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "user not found",
                email,
            });
        }
        if (user.isVerified) {
            return res.status(200).json({
                success: true,
                message: "user has already been verified. please login to your account",
            });
        }
        if (!user.otp || !user.otpExpireAt) {
            return res.status(400).json({
                success: false,
                message: "no active otp found. please request for a new otp",
            });
        }
        if (new Date() > user.otpExpireAt) {
            user.otp = undefined;
            user.otpExpireAt = undefined;
            await user.save();
            return res.status(400).json({
                success: false,
                message: "otp has expired, please request for a new otp",
            });
        }
        if (user.otp.toUpperCase() !== String(otp).trim().toUpperCase()) {
            user.otp = undefined;
            user.otpExpireAt = undefined;
            await user.save();
            return res.status(400).json({
                success: false,
                message: "invalid otp",
            });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpireAt = undefined;
        await user.save();
        return res.status(200).json({
            success: true,
            message: "user email verified success. please login to your account",
        });
    } catch (error) {
        console.error("verfiedEmail controller Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "verification failed",
        });
    }
};

const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "user not found",
            });
        }
        if (user.isVerified) {
            return res.status(200).json({
                success: true,
                message: "user has already been verified. please login to your account",
            });
        }

        if (user.otpExpireAt) {
            const coolDownSecond = parseInt(ENV.otpResendCoolDown, 10) || 60;
            const totalLifeTimeSecond = (ENV.otpExpireTime || 10) * 60;
            const remainingLifeSeconds = (new Date(user.otpExpireAt).getTime() - Date.now()) / 1000;
            const elapsedSeconds = totalLifeTimeSecond - remainingLifeSeconds;

            if (elapsedSeconds < coolDownSecond && elapsedSeconds >= 0) {
                const waitSeconds = Math.ceil(coolDownSecond - elapsedSeconds);
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${waitSeconds} second(s) before requesting a new OTP`,
                });
            }
        }
        const plainOtp = generateOtp()
        user.otp = plainOtp
        user.otpExpireAt = new Date(Date.now() + ENV.otpExpireTime * 60 * 1000);
        await user.save()

        await sendOtpEmail({
            to: user.email,
            otp: plainOtp,
            purpose: "resend-otp",
        })
        return res.status(201).json({
            success: true,
            message: "otp has been sent to your email address"
        })




    }

    catch (error) {
        console.error(`[resendOtpController] error :`, error.message)
        return res.status(500).json({
            success: false,
            message: "resend otp failed"
        });
    }
};

const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found. Please check your email.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password. Please try again.",
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Your account is not verified. Please verify your email first.",
            });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            ENV.jwtSecret,
            { expiresIn: '1h' }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                userName: user.userName,
                phoneNumber: user.phoneNumber,
            },
        });
    } catch (error) {
        console.error("[loginController] Error:", error.message || error);
        return res.status(500).json({
            success: false,
            message: "Login failed",
        });
    }
};


module.exports = {
    register,
    verifiedEmail,
    resendOtp,
    userLogin,
};
