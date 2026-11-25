const ENV = require("../config/env.js");
const User = require("../models/auth.model.js");
const generateOtp = require("../utils/otp.util.js");
const { sendOtpEmail, sendEmail } = require("../utils/emailSetup.js");
const bcrypt = require("bcrypt");
const {
    generateRefreshToken,
    generateAccessToken,
    hashToken,
    getRefreshTokenCookieOptions,

} = require("../utils/token.utils.js");







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
            return res.status(404).json({
                success: false,
                message: "User not found. Please check your email.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials. Please try again.",
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Your account is not verified. Please verify your email first.",
                code: "EMAIL_NOT_VERIFIED",
                isVerified: false,
            });
        }
        //Generate JWT Token
        const rawRefreshToken = generateRefreshToken()
        const refreshTokenHash = hashToken(rawRefreshToken)

        user.refreshToken = refreshTokenHash
        await user.save()


        const accessToken = generateAccessToken({
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
        })

        res.cookie("refresh_token", rawRefreshToken, getRefreshTokenCookieOptions());


        return res.status(200).json({
            success: true,
            message: "Login successful",
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                userName: user.userName,
                isVerified: user.isVerified,
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


const refreshAccessToken = async (req, res) => {
    try {

        const rawRefreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
        if (!rawRefreshToken) {
            return res.status(401).json({
                success: false,
                message: " Refresh token is missing, please sign in"
            })
        }
        const refreshTokenHash = hashToken(rawRefreshToken)
        const user = await User.findOne({ refreshToken: refreshTokenHash })


        if (!user) {
            res.clearCookie('refresh_token', getRefreshTokenCookieOptions())
            return res.status(401).json({
                success: false,
                message: " Refresh token is invalid or expired, please sign in"
            })
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: " your email is not verified, please verified your email first"
            })
        }
        const newRawRefreshToken = generateRefreshToken();
        const newRawRefreshTokenHash = hashToken(newRawRefreshToken);

        user.refreshToken = newRawRefreshTokenHash
        await user.save()

        const accessToken = generateAccessToken({
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        res.cookie("refresh_token", newRawRefreshToken,
            getRefreshTokenCookieOptions())



        return res.status(200).json({
            success: true,
            message: "Access Token Refresh Successfully",
            accessToken,


        })




    } catch (error) {
        console.error('[REFRESH_TOKEN_ERROR]', error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to refresh access token",
        })

    }
}
const logout = async (req, res) => {
    try {
        const rawRefreshToken = req.cookies?.refreshToken || req.refreshToken
        if (rawRefreshToken) {
            const hashToken = hashToken(rawRefreshToken)
            await User.findOneAndUpdate({
                refreshToken: hashToken
            }, { refreshToken: null })
        }
        res.clearCookie('refresh_token', getRefreshTokenCookieOptions())

        return res.status(200).json({
            success: true,
            message: "Logout successful",
        })



    } catch (error) {
        console.error('[LOGOUT_CONTROLLER_ERROR]', error.message)
        return res.status(500).json({
            success: false,
            message: "Logout failed ",
        })

    }
}

const logoutAll = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id,
            { refreshToken: null })

        res.clearCookie("refresh_token", getRefreshTokenCookieOptions())
        return res.status(200).json({
            success: true,
            message: " logout on all device successful",
        })


    } catch (error) {
        console.error('[LOGOUT_ALL_CONTROLLER_ERROR]', error.message)
        return res.status(500).json({
            success: false,
            message: "Logout All failed ",
        })
    }
}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "user not found"
            })
        }
        if (!user.isVerified) {
            return res.status(409).json({
                success: false,
                message: "this email is not verified"
            })
        }

        if (user) {
            const plainOtp = generateOtp()
            user.otp = plainOtp,
                user.otpExpireAt = new Date(Date.now() + ENV.otpExpireTime * 60 * 1000)

            await user.save()
            await sendOtpEmail({
                to: email,
                otp: plainOtp,
                purpose: "forgotPassword"
            })
            return res.status(200).json({
                success: true,
                message: "opt sent successfully"
            })
        }

    } catch (error) {
        console.error('[FORGOTPASSWORD_CONTROLLER_ERROR]', error.message)
        return res.status(500).json({
            success: false,
            message: " ForgetPassword failed",
        })

    }
}


const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "user not found",
            })
        }
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "this email is nit verified",
            })
        }
        if (user.otp !== otp) {
            return res.status(403).json({
                success: false,
                message: "invaild otp please enter correct otp",
            })
        }
        if (user.otpExpireAt < new Date()) {
            return res.status(401).json({
                success: false,
                message: "otp has expire"
            })
        }

        const hashPassword = await bcrypt.hash(newPassword, 10)


        user.newPassword = hashPassword,
            user.otp = null,
            user.otpExpireAt = null,
            user.refreshToken = null,
            user.isVerified = true,
            await user.save()
        return res.status(200).json({

            success: true,
            message: " password rest successfully",
        })


    } catch (error) {
        console.error('[RESETPASSWORD_CONTROLLER_ERROR]', error.message)
        return res.status(500).json({
            success: false,
            message: " resetPassword failed",
        })
    }

}


module.exports = {
    register,
    verifiedEmail,
    resendOtp,
    userLogin,
    refreshAccessToken,
    logout,
    logoutAll,
    forgotPassword,
    resetPassword,
};
