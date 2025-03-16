import { sql } from "./db.js";
import logger from "../config/logger.js";

export async function testConnection() {
  try {
    // Use template literal syntax for neon
    const result = await sql`
      SELECT 1 as connected, 
             current_database() as dbname, 
             current_user as user
    `;

    if (!result?.[0]?.connected) {
      throw new Error("Connection test failed - no result");
    }

    logger.info("Database connection details:", {
      database: result[0].dbname,
      user: result[0].user,
      connected: true,
    });

    return true;
  } catch (error) {
    logger.error("Database connection failed:", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
