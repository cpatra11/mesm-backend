import { Router } from "express";
import { adminRequired } from "../middleware/admin.middleware.js";
import { emailController } from "../controllers/email.controller.js";
import { validateEmailTemplate } from "../middleware/email.middleware.js";

const router = Router();

// Admin dashboard
router.get("/dashboard", adminRequired, (req, res) => {
  res.sendFile("admin-dashboard.html", { root: "./src/views" });
});

// Email template management
router.post(
  "/templates",
  adminRequired,
  validateEmailTemplate,
  emailController.createTemplate
);
router.get("/templates", adminRequired, emailController.getTemplates);
router.put("/templates/:id", adminRequired, emailController.updateTemplate);

// Email sending
router.post("/send-email", adminRequired, emailController.sendEmail);
router.post("/send-bulk", adminRequired, emailController.sendBulkEmail);

// Email logs
router.get("/logs", adminRequired, emailController.getEmailLogs);

export default router;
