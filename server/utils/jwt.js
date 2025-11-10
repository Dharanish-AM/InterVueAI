const jwt = require("jsonwebtoken");

const generateToken = (payload, secret, options) => {
  return jwt.sign(payload, secret, options);
};

const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
