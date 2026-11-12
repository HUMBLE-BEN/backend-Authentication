const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        userName: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            validate: {
                // adjust this regex to the phone format you want to accept
                validator: (v) => /^[0-9]{10,15}$/.test(v),
                message: "phone number must be 10 to 15 digits",
            },
        },
        password: {
            type: String,
            required: [true, "password is required"]
        },
        otp: {
            type: String
        },
        otpExpireAt: {
            type: Date,
            default: null
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        refreshToken: {
            type: String
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
