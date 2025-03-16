import pg from "pg";
import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
import logger from "../config/logger.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../..", ".env");

// Load environment variables first
dotenv.config({ path: envPath });

const DATABASE_URL = process.env.DATABASE_URL?.trim();

// Better validation of DATABASE_URL
if (!DATABASE_URL) {
  logger.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

logger.info("Initializing database connection...");

// Create a PostgreSQL pool
const { Pool } = pg;
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
};

const pool = new Pool(poolConfig);
const query = async (text, params = []) => {
  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Query executed in ${duration}ms`);
    return result;
  } catch (error) {
    logger.error("Query error:", error);
    throw error;
  }
};

// Setup neon sql template tag for direct SQL without placeholders
let sql = neon(process.env.DATABASE_URL);

// Add a debug option that prints the query
if (process.env.NODE_ENV !== "production") {
  const originalSql = sql;
  // Create a proxy to log all SQL queries
  sql = new Proxy(originalSql, {
    apply: function (target, thisArg, args) {
      const queryString = String.raw(...args);
      logger.debug("SQL query:", queryString);
      return target(...args);
    },
  });
}

// Verify database setup and initialize if needed
async function verifyDatabaseSetup() {
  try {
    // Test basic connectivity first
    const testResult = await sql`SELECT 1 as connected`;
    if (!testResult?.[0]?.connected) {
      throw new Error("Database connection test failed");
    }
    logger.info("Database connection verified");

    // Check if schema exists
    const schemaResult = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = 'public'
      );
    `;

    if (!schemaResult?.[0]?.exists) {
      logger.info("Schema does not exist, initializing database...");
      const { default: initializeDatabase } = await import("./init.js");
      await initializeDatabase();
    } else {
      // Check if tables need to be created
      const tablesResult = await sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `;

      if (!tablesResult?.[0]?.exists) {
        logger.info("Tables do not exist, running migrations...");
        const { default: migrate } = await import("./migrate.js");
        await migrate();
      }
    }

    logger.info("Database setup verified");
  } catch (error) {
    logger.error("Database verification failed:", error);
    throw error;
  }
}

// Run verification with proper error handling
try {
  await verifyDatabaseSetup();
} catch (error) {
  logger.error("Fatal: Database setup failed:", error);
  process.exit(1);
}

const closeConnection = async () => {
  // Neon manages connections automatically
  return;
};

const getClient = async () => {
  // Neon handles connection pooling internally
  return {
    query: async (...args) => {
      return await query(...args);
    },
    release: () => {},
  };
};

export { sql, query, closeConnection, getClient };
