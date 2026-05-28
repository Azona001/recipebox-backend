const { expressjwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");
require("dotenv").config();

const verifyToken = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri: `${process.env.JWKS_CLIENT}`,
    rateLimit: true,
    cache: true,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: process.env.AUTH0_DOMAIN,
  algorithms: ["RS256"],
});

module.exports = verifyToken;
