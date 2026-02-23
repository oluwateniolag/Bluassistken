const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '15m'; // Shorter access token
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d'; // Longer refresh token

// Generate access token (short-lived)
exports.generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE
  });
};

// Generate refresh token (long-lived)
exports.generateRefreshToken = (id) => {
  return jwt.sign({ id, type: 'refresh' }, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRE
  });
};

// Verify JWT token
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Verify refresh token
exports.verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};
