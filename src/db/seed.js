import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sql } from "./db.js";
import logger from "../config/logger.js";
import migrate from "./migrate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Improved SQL statement splitter that handles complex queries better
function splitSqlStatements(sqlContent) {
  const statements = [];
  let current = "";
  let inString = false;
  let stringChar = "";
  let depth = 0;

  for (let i = 0; i < sqlContent.length; i++) {
    const char = sqlContent[i];

    // Handle string literals
    if ((char === "'" || char === '"') && !inString) {
      inString = true;
      stringChar = char;
    } else if (char === stringChar && inString) {
      inString = false;
    }

    // Track nested blocks when not in string
    if (!inString) {
      if (char === "(") depth++;
      if (char === ")") depth--;
    }

    current += char;

    // Only split on semicolon when not in string and not in nested block
    if (char === ";" && !inString && depth === 0) {
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

async function executeSqlStatement(statement) {
  try {
    // Handle different SQL statements appropriately
    const normalizedStatement = statement.trim().toUpperCase();

    if (
      normalizedStatement.startsWith("TRUNCATE") ||
      normalizedStatement.startsWith("ALTER")
    ) {
      await sql.unsafe(statement);
      return;
    }

    if (normalizedStatement.startsWith("INSERT")) {
      // Remove any $1 style parameters for direct insertion
      const cleanedStatement = statement
        .replace(/\$\d+/g, "?")
        .replace(/NOW\(\)/g, "CURRENT_TIMESTAMP");
      await sql.unsafe(cleanedStatement);
      return;
    }

    // Default case
    await sql.unsafe(statement);
  } catch (error) {
    logger.error(`Failed to execute SQL: ${statement}`, error);
    throw error;
  }
}

async function seedUsers() {
  try {
    console.log("Starting user seeding...");

    // Execute truncate directly with unformatted to preserve SQL as-is
    await sql.unformatted`TRUNCATE users CASCADE`;
    await sql.unformatted`ALTER SEQUENCE users_id_seq RESTART WITH 1`;

    const seedSQL = fs.readFileSync(
      path.join(__dirname, "seeds", "users.sql"),
      "utf-8"
    );
    const statements = splitSqlStatements(seedSQL);

    for (const statement of statements) {
      await executeSqlStatement(statement);
    }
    console.log("User seeding completed successfully");
  } catch (error) {
    logger.error("User seeding failed:", error);
    throw error;
  }
}

async function seedRegistrations() {
  try {
    console.log("Starting registrations seeding...");

    // First clean up registrations and participants
    await sql.unsafe("TRUNCATE registrations, participants CASCADE");
    await sql.unsafe("ALTER SEQUENCE registrations_id_seq RESTART WITH 1");
    await sql.unsafe("ALTER SEQUENCE participants_id_seq RESTART WITH 1");

    const seedSQL = fs.readFileSync(
      path.join(__dirname, "seeds", "registrations.sql"),
      "utf-8"
    );

    // Split and execute statements one by one
    const statements = splitSqlStatements(seedSQL);

    for (const statement of statements) {
      try {
        await executeSqlStatement(statement);
      } catch (error) {
        logger.error(
          `Failed executing statement: ${statement.substring(0, 100)}...`,
          error
        );
        throw error;
      }
    }

    // Verify the data was inserted
    const regCount = await sql`SELECT COUNT(*) FROM registrations`;
    const partCount = await sql`SELECT COUNT(*) FROM participants`;

    logger.info(
      `Seeded ${regCount[0].count} registrations and ${partCount[0].count} participants`
    );
    console.log(
      "Registrations and participants seeding completed successfully"
    );
  } catch (error) {
    logger.error("Registration seeding failed:", error);
    throw error;
  }
}

async function seedEmailTemplates() {
  try {
    console.log("Starting email templates seeding...");
    const seedSQL = await fs.readFile(
      path.join(__dirname, "seeds", "email_templates.sql"),
      "utf-8"
    );

    await sql.unsafe(seedSQL);

    console.log("Email templates seeding completed successfully");
  } catch (error) {
    logger.error("Email templates seeding failed:", error);
    throw error;
  }
}

// Run all seeds
async function runSeeds() {
  try {
    logger.info("Starting seeding process...");

    // Use unformatted for direct SQL execution
    await sql.unformatted`TRUNCATE users, registrations, participants CASCADE`;
    await sql.unformatted`ALTER SEQUENCE users_id_seq RESTART WITH 1`;
    await sql.unformatted`ALTER SEQUENCE registrations_id_seq RESTART WITH 1`;
    await sql.unformatted`ALTER SEQUENCE participants_id_seq RESTART WITH 1`;

    // Run seeds in order
    await seedEmailTemplates();
    await seedUsers();
    await seedRegistrations();

    logger.info("All seeds completed successfully");
  } catch (error) {
    logger.error("Seeding failed:", error);
    process.exit(1);
  }
}

// Run seeds only if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeeds().then(() => process.exit(0));
}

export default runSeeds;
