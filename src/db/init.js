import { fileURLToPath } from "url";
import path from "path";
import logger from "../config/logger.js";
import { executeSql, executeTransaction } from "./utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeDatabase() {
  try {
    logger.info("Starting database initialization...");

    // Reset schema with error handling
    try {
      await executeTransaction([
        "DROP SCHEMA IF EXISTS public CASCADE",
        "CREATE SCHEMA public",
        "GRANT ALL ON SCHEMA public TO current_user",
        "GRANT ALL ON SCHEMA public TO public",
      ]);
      logger.info("Schema reset completed");
    } catch (error) {
      logger.error("Schema reset failed:", error);
      throw error;
    }

    // Run migrations with error handling
    try {
      const { default: migrate } = await import("./migrate.js");
      await migrate();
      logger.info("Migrations completed successfully");
    } catch (error) {
      logger.error("Migrations failed:", error);
      throw error;
    }

    // Run seeds with error handling
    try {
      const { default: runSeeds } = await import("./seed.js");
      await runSeeds();
      logger.info("Seeds completed successfully");
    } catch (error) {
      logger.error("Seeding failed:", error);
      throw error;
    }

    // Verify setup
    const result = await executeSql(
      "SELECT EXISTS (SELECT 1 FROM users WHERE is_admin = true) as has_admin"
    );

    if (!result.rows[0]?.has_admin) {
      logger.warn("No admin users found after initialization");
    } else {
      logger.info("Database initialization completed successfully");
    }
  } catch (error) {
    logger.error("Database initialization failed:", error);
    throw error;
  }
}

export default initializeDatabase;
