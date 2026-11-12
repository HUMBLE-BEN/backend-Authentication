const otpGenerator = require("otp-generator")

const generateOtp = () => {
    return otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: true,
        specialChars: false,
    })
}








module.exports = generateOtp

