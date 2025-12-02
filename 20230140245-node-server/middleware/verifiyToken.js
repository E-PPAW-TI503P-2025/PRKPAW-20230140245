const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token tidak ditemukan." });
  }

  const token = authHeader.split(" ")[1]; // ambil setelah "Bearer"

  if (!token) {
    return res.status(401).json({ message: "Token tidak valid." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // simpan user ke request agar bisa diakses controller
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token tidak valid atau kedaluwarsa.",
      error: error.message,
    });
  }
};
