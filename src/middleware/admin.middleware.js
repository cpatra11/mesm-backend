import { sql } from "../db/db.js";
import logger from "../config/logger.js";

export const adminRequired = async (req, res, next) => {
  try {
    const result = await sql`
      SELECT is_admin 
      FROM users 
      WHERE id = ${req.user.id}
    `;

    if (!result[0] || !result[0].is_admin) {
      logger.warn(`Non-admin access attempt by user ID ${req.user.id}`);
      return res.status(403).json({ message: "Admin access required" });
    }

    logger.info(`Admin access granted for user ID ${req.user.id}`);
    next();
  } catch (error) {
    logger.error("Admin middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
