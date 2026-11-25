const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const ENV = require("../config/env");


//generate access token for a short period of time with jwt
const generateAccessToken = (payload) => {
  return jwt.sign(payload, ENV.jwt_access_secret, {
    expiresIn: ENV.jwt_access_expires
  })
}
//verified access token with jwt
const verifiedAccessToken = (token) => {
  return jwt.verify(token, ENV.jwt_access_secret

  )
}
//generate a cryptographically secure random string for a long period of time for a refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString("hex")

}
// hash a token for storing it in database and compare itb with token from the request
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest("hex")
}
const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: ENV.cookie_secure,
  sameSite: ENV.cookie_same_site,
  maxAge: ENV.refresh_token_expires * 24 * 60 * 60 * 1000,
  path: '/auth'
})


module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifiedAccessToken,
  hashToken,
  getRefreshTokenCookieOptions
}
