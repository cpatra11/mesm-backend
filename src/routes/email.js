import { Router } from "express";
import { emailController } from "../controllers/email.controller.js";
import verifyAuth from "../middlewares/verifyAuth.js";
import { verifyAdmin } from "../middlewares/verifyAuth.js";

const router = Router();

// Template management
router.post(
  "/templates",
  verifyAuth,
  verifyAdmin,
  emailController.createTemplate
);
router.get("/templates", verifyAuth, verifyAdmin, emailController.getTemplates);
router.put(
  "/templates/:id",
  verifyAuth,
  verifyAdmin,
  emailController.updateTemplate
);

// Sending emails
router.post("/send", verifyAuth, verifyAdmin, emailController.sendEmail);
router.post(
  "/send-bulk",
  verifyAuth,
  verifyAdmin,
  emailController.sendBulkEmail
);

// Email logs
router.get("/logs", verifyAuth, verifyAdmin, emailController.getEmailLogs);

export default router;
