const jwt = require("jsonwebtoken");

function adminAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Please login first"
    });
  }

  try {
    const token = header.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Admin access only"
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}

module.exports = adminAuth;