import dotenv from "dotenv";
import { query as db } from "../db/db.js";
import { hashPassword } from "../utils.js";
import logger from "../config/logger.js";

dotenv.config();

const adminUser = {
  email: "admin@mesem.com",
  password: "admin123", // This should be changed in production
  name: "Admin User",
  isAdmin: true,
};

async function seedAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await db("SELECT * FROM users WHERE email = $1", [
      adminUser.email.toLowerCase(),
    ]);

    if (existingAdmin.rows.length > 0) {
      // Update password if user exists
      const hashedPassword = await hashPassword(adminUser.password);
      await db("UPDATE users SET password = $1 WHERE email = $2", [
        hashedPassword,
        adminUser.email.toLowerCase(),
      ]);
      logger.info("Admin password updated");
      return;
    }

    // Hash password before storing
    const hashedPassword = await hashPassword(adminUser.password);

    // Insert admin user with all required fields
    const result = await db(
      "INSERT INTO users (email, password, name, is_admin, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id",
      [
        adminUser.email.toLowerCase(),
        hashedPassword,
        adminUser.name,
        adminUser.isAdmin,
      ]
    );

    logger.info(`Admin user created with ID: ${result.rows[0].id}`);
  } catch (error) {
    logger.error("Error seeding admin user:", error);
    throw error;
  }
}

// Run seeder
seedAdmin().then(() => {
  logger.info("Admin seeding completed");
  process.exit(0);
});
