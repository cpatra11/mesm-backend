import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const sql = neon(process.env.DATABASE_URL);

async function testConnection() {
  try {
    const result = await sql`SELECT 1`;
    console.log("Database connection successful:", result);
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}

testConnection();
