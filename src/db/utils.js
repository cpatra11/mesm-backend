import { sql } from "./db.js";
import logger from "../config/logger.js";

export async function executeSql(statement, params = []) {
  try {
    if (!statement?.trim()) {
      return { rows: [] };
    }

    let result;
    if (typeof statement === "string") {
      // Convert string query to template literal for neon
      result = await sql`${statement}`;
    } else {
      result = await statement;
    }

    return { rows: Array.isArray(result) ? result : [] };
  } catch (error) {
    logger.error("SQL execution error:", {
      error: error.message,
      statement:
        typeof statement === "string" ? statement : "SQL Template Literal",
    });
    throw error;
  }
}

export async function executeTransaction(statements) {
  try {
    logger.debug("Starting transaction with", statements.length, "statements");

    // Use template literals for transaction control
    await sql`BEGIN`;

    for (const stmt of statements) {
      if (stmt.trim()) {
        try {
          await sql`${stmt}`; // Changed to template literal
        } catch (error) {
          await sql`ROLLBACK`;
          logger.error("Transaction statement failed:", {
            statement: stmt,
            error: error.message,
          });
          throw error;
        }
      }
    }

    await sql`COMMIT`;
    logger.debug("Transaction completed successfully");
  } catch (error) {
    try {
      await sql`ROLLBACK`;
    } catch (rollbackError) {
      logger.error("Rollback failed:", rollbackError);
    }
    logger.error("Transaction failed:", error);
    throw error;
  }
}
