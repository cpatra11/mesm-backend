import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import verifyAuth from "../middlewares/verifyAuth.js";
import path from "path";
import { fileURLToPath } from "url";
import { adminRequired } from "../middleware/admin.middleware.js";
import cors from "cors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Google OAuth routes - maintain these for all users including admin
router.get("/google", authController.googleAuth);
router.get("/google/callback", authController.googleAuthCallback);
router.get("/logout", authController.logout);
router.get("/me", verifyAuth, authController.getCurrentUser);
router.post("/verify-otp", authController.verifyOTP);

// Admin routes
router.get("/admin/verify", verifyAuth, adminRequired, (req, res) => {
  try {
    res.status(200).json({
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        is_admin: req.user.is_admin,
      },
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(401).json({ valid: false, message: "Authentication failed" });
  }
});

// Remove admin test login routes in production
if (process.env.NODE_ENV !== "production") {
  router.get("/admin/login-page", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/admin-test.html"));
  });
}

export default router;
