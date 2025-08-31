require("dotenv").config();
const jwt = require("jsonwebtoken");
let blacklist = new Set();

exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_TEMP_SECRET_KEY);
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

exports.requireRole = (...roles) => {
  return (req, res, next) => {

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access Denied" });
    }

    next();
  };
};

exports.logout = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(400).json({ message: "Token is missing from request." });
  }

  blacklist.add(token);

  return res
    .status(200)
    .json({ message: "Logout successful, token invalidated.", status: 200 });
};

exports.blacklist = blacklist;
