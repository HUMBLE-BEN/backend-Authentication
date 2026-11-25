const { verifiedAccessToken } = require("../utils/token.utils");
const User = require("../models/auth.model");


const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.get("Authorization");

        if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access Token is Missing or malformed",
            });
        }
        const token = authHeader.slice("Bearer ".length).trim();
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access Token is Missing or malformed",
            });
        }

        let decodedToken;

        try {
            decodedToken = verifiedAccessToken(token);
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({
                    success: false,
                    message: "Access Token is expired. Please refresh your account.",
                });
            }
            return res.status(401).json({
                success: false,
                message: "Access Token is invalid",
            });
        }

        const user = await User.findById(decodedToken.sub)
            .select("-password -refreshToken");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account no longer exists",
            });
        }

        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: "This account is not verified. Please check your email to verify your account.",

            })
        }
        req.user = user;
        req.auth = decodedToken;

        return next();
    } catch (error) {
        console.error("[AuthMiddleware Error]", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        })

    }
}
module.exports = { authenticateToken };
