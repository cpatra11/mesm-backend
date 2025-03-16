import dotenv from "dotenv";
import { query as db } from "../db/db.js";
import logger from "../config/logger.js";

dotenv.config();

// List of Google email addresses that should have admin access
const adminEmails = [
  "admin@example.com", // Replace with actual admin Google emails
  // Add more emails as needed
];

async function setGoogleAdmins() {
  try {
    for (const email of adminEmails) {
      // Check if user exists
      const existingUser = await db("SELECT * FROM users WHERE email = $1", [
        email.toLowerCase(),
      ]);

      if (existingUser.rows.length > 0) {
        // Update existing user to admin
        await db("UPDATE users SET is_admin = true WHERE email = $1", [
          email.toLowerCase(),
        ]);
        logger.info(`Updated admin status for existing user: ${email}`);
      } else {
        // Create placeholder user record that will be updated when they first login
        await db("INSERT INTO users (email, is_admin) VALUES ($1, true)", [
          email.toLowerCase(),
        ]);
        logger.info(`Created placeholder admin user for: ${email}`);
      }
    }

    logger.info(`Admin privileges set for ${adminEmails.length} accounts`);
  } catch (error) {
    logger.error("Error setting Google admins:", error);
  }
}

// Run the script
setGoogleAdmins()
  .then(() => {
    logger.info("Google admin setup completed");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Google admin setup failed:", error);
    process.exit(1);
  });
