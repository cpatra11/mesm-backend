import { sql } from "../db/db.js";
import logger from "../config/logger.js";

export const userController = {
  getUsers: async (req, res) => {
    try {
      logger.info("Fetching users...");
      logger.info("Request user:", req.user);

      if (!req.user?.is_admin) {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      const users = await sql`
        SELECT 
          id,
          email,
          name,
          COALESCE(is_admin, false) as is_admin,
          created_at,
          updated_at,
          last_login_at,
          profile_picture
        FROM users 
        ORDER BY created_at DESC
      `;

      logger.info(`Found ${users.length} users`);
      return res.status(200).json({
        success: true,
        users: users || [],
      });
    } catch (error) {
      logger.error("Error fetching users:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching users",
        error: error.message,
      });
    }
  },

  toggleAdmin: async (req, res) => {
    try {
      const { id } = req.query;
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: "Valid user ID required" });
      }

      const userId = parseInt(id);

      // First check if user exists
      const userCheck = await sql`
        SELECT * FROM users WHERE id = ${userId}
      `;

      if (userCheck.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      // Toggle is_admin status
      const currentStatus = userCheck[0].is_admin || false;

      const result = await sql`
        UPDATE users 
        SET is_admin = ${!currentStatus}, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING id, email, name, is_admin, created_at, updated_at
      `;

      return res.status(200).json({
        success: true,
        message: `Admin status ${
          !currentStatus ? "granted" : "revoked"
        } for user`,
        user: result[0],
      });
    } catch (error) {
      logger.error("Error toggling admin status:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating user status",
        error: error.message,
      });
    }
  },

  createUser: async (req, res) => {
    try {
      const { email, name, password } = req.body;
      const user = await sql`
        INSERT INTO users (email, name, password) 
        VALUES (${email}, ${name}, ${password}) 
        RETURNING id, email, name, is_admin
      `;
      res.status(201).json({ user: user[0] });
    } catch (error) {
      logger.error("Error creating user:", error);
      res.status(500).json({ message: "Error creating user" });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { email, name } = req.body;
      const user = await sql`
        UPDATE users 
        SET email = ${email}, name = ${name} 
        WHERE id = ${id} 
        RETURNING id, email, name, is_admin
      `;
      res.status(200).json({ user: user[0] });
    } catch (error) {
      logger.error("Error updating user:", error);
      res.status(500).json({ message: "Error updating user" });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      await sql`
        DELETE FROM users 
        WHERE id = ${id}
      `;
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      logger.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user" });
    }
  },

  getUserDetails: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await sql`
        SELECT id, email, name, is_admin, created_at 
        FROM users 
        WHERE id = ${id}
      `;
      if (user.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ user: user[0] });
    } catch (error) {
      logger.error("Error fetching user details:", error);
      res.status(500).json({ message: "Error fetching user details" });
    }
  },
};
