import jwt from "jsonwebtoken";
import { sql } from "../db/db.js";
import logger from "../config/logger.js";

// Validate JWT_SECRET
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

// Middleware to verify JWT token
const verifyAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      // Add more debug logging
      logger.info(
        "Verifying token with secret length:",
        process.env.JWT_SECRET.length
      );

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get the user from the database using sql template literals
      const users = await sql`SELECT * FROM users WHERE id = ${decoded.id}`;

      if (users.length === 0) {
        return res.status(401).json({ message: "User not found" });
      }

      // Attach user to request
      req.user = users[0];
      next();
    } catch (jwtError) {
      logger.error("JWT verification error:", {
        error: jwtError.message,
        token: token.substring(0, 10) + "...",
        secretLength: process.env.JWT_SECRET.length,
      });
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    logger.error("Authentication error:", error);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

// Verify if user is admin
const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // Check for is_admin or role === 'admin' to handle different user schemas
  if (!(req.user.is_admin || req.user.role === "admin")) {
    logger.warn(`Access denied for user ${req.user.id}: not an admin`);
    return res.status(403).json({ message: "Admin privileges required" });
  }

  next();
};

export default verifyAuth;
export { verifyAdmin };
