import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sql } from "./db.js";
import logger from "../config/logger.js";
import { executeSql, executeTransaction } from "./utils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Better SQL statement splitting that handles nested statements and dollar quotes
function splitSqlStatements(sql) {
  const statements = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let stringChar = "";
  let inDollarString = false;
  let dollarTag = "";

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1] || "";

    // Handle dollar quoted strings (e.g. $$ ... $$)
    if (char === "$" && nextChar === "$" && !inString && !inDollarString) {
      inDollarString = true;
      dollarTag = "$$";
      current += char;
      continue;
    }
    if (
      inDollarString &&
      char === "$" &&
      nextChar === "$" &&
      dollarTag === "$$"
    ) {
      inDollarString = false;
      dollarTag = "";
    }

    // Handle regular strings
    if ((char === "'" || char === '"') && !inDollarString) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (stringChar === char) {
        inString = false;
      }
    }

    // Track nested blocks
    if (!inString && !inDollarString) {
      if (char === "(") depth++;
      if (char === ")") depth--;
    }

    // Add character to current statement
    current += char;

    // Statement terminator
    if (char === ";" && !inString && !inDollarString && depth === 0) {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = "";
    }
  }

  // Add final statement if exists
  const trimmed = current.trim();
  if (trimmed) statements.push(trimmed);

  return statements.filter((stmt) => stmt.length > 0);
}

async function executeMigration(file) {
  const sqlContent = fs.readFileSync(
    path.join(__dirname, "migrations", file),
    "utf-8"
  );
  const statements = splitSqlStatements(sqlContent);

  try {
    await executeTransaction(statements);
    await executeSql("INSERT INTO migrations (name) VALUES ($1)", [file]);
    logger.info(`Migration ${file} completed successfully`);
    return true;
  } catch (error) {
    logger.error(`Migration ${file} failed:`, error);
    throw error;
  }
}

async function migrate() {
  try {
    logger.info("Starting database migration");

    // Ensure migrations directory exists
    const migrationsDir = path.join(__dirname, "migrations");
    try {
      await fs.promises.mkdir(migrationsDir, { recursive: true });
      logger.info("Migrations directory verified");
    } catch (error) {
      logger.error("Failed to create migrations directory:", error);
      throw error;
    }

    // Copy init schema to migrations if it doesn't exist
    const initSchemaSource = path.join(
      __dirname,
      "migrations",
      "20240320_init_schema.sql"
    );
    if (!fs.existsSync(initSchemaSource)) {
      try {
        await fs.promises.copyFile(
          path.join(__dirname, "schema", "init.sql"),
          initSchemaSource
        );
        logger.info("Initial schema migration created");
      } catch (error) {
        logger.error("Failed to create initial schema migration:", error);
        throw error;
      }
    }

    // Create migrations table
    await executeSql(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info("Migrations table created");

    // Get migration files
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    logger.info(`Found ${files.length} migration files`);

    // Execute migrations
    for (const file of files) {
      try {
        const filePath = path.join(migrationsDir, file);
        const content = await fs.promises.readFile(filePath, "utf8");

        logger.info(`Executing migration: ${file}`);

        // Execute migration in transaction
        await executeSql("BEGIN");
        try {
          await executeSql(content);
          await executeSql(
            "INSERT INTO migrations (name) VALUES ($1) ON CONFLICT DO NOTHING",
            [file]
          );
          await executeSql("COMMIT");
          logger.info(`Migration ${file} completed`);
        } catch (error) {
          await executeSql("ROLLBACK");
          throw error;
        }
      } catch (error) {
        logger.error(`Migration ${file} failed:`, error);
        throw error;
      }
    }

    logger.info("All migrations completed successfully");
    return files.length;
  } catch (error) {
    logger.error("Migration process failed:", error);
    throw error;
  }
}

// Allow running directly or as module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  migrate().catch((error) => {
    logger.error(error);
    process.exit(1);
  });
}

export default migrate;
