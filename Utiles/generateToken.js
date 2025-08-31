const jwt = require('jsonwebtoken');
require('dotenv').config();
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_TEMP_SECRET_KEY,
    { expiresIn: '1h' } 
  );
};

module.exports = generateToken;
