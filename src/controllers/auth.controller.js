import dotenv from "dotenv";
import crypto from "crypto";

// Move dotenv config to top and force reload
dotenv.config({ override: true });

// Validate required environment variables
const requiredEnvVars = [
  "GOOGLE_OAUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_ACCESS_TOKEN_URL",
  "GOOGLE_USER_INFO_URL",
  "JWT_SECRET",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

const {
  GOOGLE_OAUTH_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_ACCESS_TOKEN_URL,
  GOOGLE_USER_INFO_URL,
} = process.env;

// Add debug logging
console.log("Loaded CLIENT_ID:", GOOGLE_CLIENT_ID);

const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

import { sql } from "../db/db.js";
import logger from "../config/logger.js";
import { generateToken, comparePassword } from "../utils.js";
import { emailService } from "../services/email.service.js";
import { getGoogleTokens, getGoogleUserInfo } from "../utils/googleAuth.js";
import { constructCallbackUrl, getBackendUrl } from "../utils/url.js";

export const authController = {
  googleAuth: async (req, res) => {
    try {
      // Add validation
      if (!GOOGLE_CLIENT_ID) {
        throw new Error("Google Client ID is not configured");
      }

      const state = crypto.randomBytes(16).toString("hex");
      const scopes = GOOGLE_OAUTH_SCOPES.join(" ");

      // Get origin from request headers or default to ADMIN_DASHBOARD_URL
      const origin = req.headers.origin || process.env.ADMIN_DASHBOARD_URL;
      const isAdminRequest = origin === process.env.ADMIN_DASHBOARD_URL;

      // Get backend URL dynamically
      const backendUrl = getBackendUrl()(req);
      const callbackUrl = `${backendUrl}/api/v1/auth/google/callback`;
      logger.info("Callback URL:", callbackUrl); // Add logging

      // Store admin flag in state by creating a compound state
      const stateData = {
        random: state,
        isAdmin: isAdminRequest,
        origin, // Store the origin in state
      };

      // Encode state data as base64 JSON
      const encodedState = Buffer.from(JSON.stringify(stateData)).toString(
        "base64"
      );

      // Add debug logging
      logger.info("OAuth configuration:", {
        clientId: GOOGLE_CLIENT_ID,
        callbackUrl,
        scopes,
        isAdminRequest,
      });

      // Use URLSearchParams for better URL construction
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: callbackUrl,
        response_type: "code",
        scope: scopes,
        access_type: "offline",
        state: encodedState,
        prompt: "consent",
      });

      const authUrl = `${GOOGLE_OAUTH_URL}?${params.toString()}`;
      logger.info("Generated OAuth URL:", authUrl);

      // Debug log the full auth URL
      logger.info("Auth URL Parameters:", {
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: callbackUrl,
        scope: scopes,
        state: encodedState,
      });

      return res.status(200).json({
        success: true,
        url: authUrl,
      });
    } catch (error) {
      logger.error("OAuth Configuration Error:", error);
      return res.status(500).json({
        success: false,
        message: "OAuth configuration error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
  googleAuthCallback: async (req, res) => {
    try {
      const { code, state } = req.query;

      if (!code) {
        logger.error("No code received from Google");
        return res.redirect(`${process.env.ADMIN_DASHBOARD_URL}?error=no_code`);
      }

      // Decode state to check if admin login
      let stateData;
      try {
        const decodedState = Buffer.from(state, "base64").toString();
        stateData = JSON.parse(decodedState);
      } catch (e) {
        logger.error("Invalid state parameter:", e);
        return res.redirect(
          `${process.env.ADMIN_DASHBOARD_URL}?error=invalid_state`
        );
      }

      try {
        // Start transaction
        await sql`BEGIN`;

        // Get backend URL dynamically
        const backendUrl = getBackendUrl()(req);
        const callbackUrl = `${backendUrl}/api/v1/auth/google/callback`;

        // Exchange code for tokens
        const tokens = await getGoogleTokens(code, callbackUrl);
        logger.info("Received tokens from Google");

        // Get user info
        const googleUser = await getGoogleUserInfo(tokens.access_token);
        logger.info("Received user info from Google");

        // Save/update user with proper SQL syntax using template literals
        const user = await sql`
          INSERT INTO users (
            email, name, google_id, profile_picture, access_token, 
            refresh_token, token_expires_at, last_login_at, is_admin
          ) VALUES (
            ${googleUser.email},
            ${googleUser.name},
            ${googleUser.sub},
            ${googleUser.picture},
            ${tokens.access_token},
            ${tokens.refresh_token},
            ${
              tokens.expires_in
                ? new Date(Date.now() + tokens.expires_in * 1000)
                : null
            },
            CURRENT_TIMESTAMP,
            ${true}
          )
          ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            google_id = EXCLUDED.google_id,
            profile_picture = EXCLUDED.profile_picture,
            access_token = EXCLUDED.access_token,
            refresh_token = EXCLUDED.refresh_token,
            token_expires_at = EXCLUDED.token_expires_at,
            last_login_at = CURRENT_TIMESTAMP
          RETURNING *
        `;

        // Generate JWT token
        const token = generateToken(
          user[0].email,
          user[0].id,
          true // Force admin status for admin dashboard
        );

        // Update cookie settings for production
        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
          domain:
            process.env.NODE_ENV === "production"
              ? process.env.COOKIE_DOMAIN
              : undefined,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });

        await sql`COMMIT`;

        // Update redirect URL to always go to /auth instead of /dashboard
        const redirectUrl =
          process.env.NODE_ENV === "production"
            ? process.env.ADMIN_DASHBOARD_URL
            : "http://localhost:5173";

        const userData = {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
          is_admin: true,
        };

        const base64User = Buffer.from(JSON.stringify(userData)).toString(
          "base64"
        );
        // Change redirect to /auth instead of /dashboard
        const authRedirectUrl = `${redirectUrl}/auth?user=${encodeURIComponent(
          base64User
        )}`;

        logger.info("Redirecting to:", authRedirectUrl);
        return res.redirect(authRedirectUrl);
      } catch (error) {
        await sql`ROLLBACK`;
        throw error;
      }
    } catch (error) {
      logger.error("OAuth callback failed:", error);
      const errorUrl = `${
        process.env.ADMIN_DASHBOARD_URL
      }/login?error=${encodeURIComponent(error.message)}`;
      return res.redirect(errorUrl);
    }
  },
  logout: async (req, res) => {
    try {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        path: "/",
      };

      if (process.env.NODE_ENV === "production") {
        cookieOptions.domain = process.env.COOKIE_DOMAIN;
      }

      res.clearCookie("token", cookieOptions);
      res
        .status(200)
        .json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      logger.error("Logout Error:", error);
      res.status(500).json({ error: error.message });
    }
  },
  getCurrentUser: async (req, res) => {
    try {
      const user = req.user;

      const result = await sql`
        SELECT id, name, email, is_admin 
        FROM users 
        WHERE id = ${user.id}
      `;
      const currentUser = result[0];
      logger.info(`Fetched current user: ${currentUser}`);
      res.status(200).json({ user: currentUser });
    } catch (error) {
      logger.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  adminLogin: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      // First check if user exists and is admin
      const user = await sql`
        SELECT * FROM users 
        WHERE email = ${email.toLowerCase()} 
        AND is_admin = true
      `;

      if (!user[0]) {
        logger.warn(`Admin login attempt failed for email: ${email}`);
        return res.status(401).json({
          success: false,
          message: "Invalid credentials or not an admin user",
        });
      }

      const isValidPassword = await comparePassword(password, user[0].password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const token = generateToken(user[0].email, user[0].id, user[0].is_admin);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
        domain:
          process.env.NODE_ENV === "production"
            ? process.env.COOKIE_DOMAIN
            : undefined,
      });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
          is_admin: user[0].is_admin,
        },
      });
    } catch (error) {
      logger.error("Admin login error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  verifyOTP: async (req, res) => {
    try {
      const { userId, code } = req.body;

      const user = await sql`
        SELECT * FROM users 
        WHERE id = ${userId}
        AND verification_code = ${code}
        AND verification_code_expires_at > NOW()
        AND verification_attempts < 3
      `;

      if (!user[0]) {
        await sql`
          UPDATE users 
          SET verification_attempts = verification_attempts + 1 
          WHERE id = ${userId}
        `;
        return res.status(401).json({ message: "Invalid or expired code" });
      }

      // Mark as verified and clear verification data
      await sql`
        UPDATE users 
        SET is_verified = true,
            verification_code = NULL,
            verification_code_expires_at = NULL,
            verification_attempts = 0
        WHERE id = ${userId}
      `;

      // Generate token and set cookie
      const token = generateToken(user[0].email, user[0].id, true);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        // ...existing cookie options
      });

      return res.status(200).json({
        success: true,
        message: "Verification successful",
        user: {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
          is_admin: true,
        },
      });
    } catch (error) {
      logger.error("Verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  },

  // Development only - admin test login
  adminTestLogin: async (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(404).json({ message: "Route not found" });
    }

    try {
      const user = await sql`
        SELECT * FROM users 
        WHERE email = ${"admin@mesem.com"} 
        AND is_admin = true
      `;

      if (!user[0]) {
        return res.status(404).json({ message: "Admin user not found" });
      }

      const token = generateToken(user[0].email, user[0].id);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        domain: new URL(process.env.ADMIN_URL).hostname,
      });

      return res.status(200).json({
        success: true,
        redirectUrl: `${process.env.ADMIN_URL}/dashboard`,
        user: {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
          isAdmin: user[0].is_admin,
        },
      });
    } catch (error) {
      logger.error("Admin test login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};
