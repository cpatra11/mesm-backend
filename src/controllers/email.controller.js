import { sql } from "../db/db.js"; // Change this import to use sql
import logger from "../config/logger.js";
import { emailService } from "../services/email.service.js";
import { adminRequired } from "../middleware/admin.middleware.js";

export const emailController = {
  createTemplate: [
    adminRequired,
    async (req, res) => {
      try {
        const {
          name,
          subject,
          content,
          variables,
          template_type = "notification",
        } = req.body;

        const result = await db(
          `INSERT INTO email_templates (name, subject, content, variables, template_type)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [name, subject, content, JSON.stringify(variables), template_type]
        );

        res.status(201).json({
          success: true,
          template: result.rows[0],
        });
      } catch (error) {
        logger.error("Error creating email template:", error);
        res.status(500).json({ success: false, message: error.message });
      }
    },
  ],

  getTemplates: [
    adminRequired,
    async (req, res) => {
      try {
        const templates = await sql`
          SELECT * FROM email_templates 
          WHERE name IN ('registration_approval', 'registration_rejection')
          ORDER BY name`;

        res.json({
          success: true,
          templates: templates,
        });
      } catch (error) {
        logger.error("Error fetching email templates:", error);
        res.status(500).json({ success: false, message: error.message });
      }
    },
  ],

  updateTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      const { content, subject, name, variables } = req.body;

      const templateId = parseInt(id, 10);

      // Update template without checking existence first
      const result = await sql`
        INSERT INTO email_templates (id, name, subject, content, variables)
        VALUES (${templateId}, ${name}, ${subject}, ${content}, ${JSON.stringify(
        variables || {}
      )})
        ON CONFLICT (id) DO UPDATE
        SET content = EXCLUDED.content,
            subject = EXCLUDED.subject,
            name = EXCLUDED.name,
            variables = EXCLUDED.variables,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Template not found",
        });
      }

      res.json({
        success: true,
        message: "Template updated successfully",
        template: result[0],
      });
    } catch (error) {
      logger.error("Error updating email template:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update template",
      });
    }
  },

  sendEmail: [
    adminRequired,
    async (req, res) => {
      try {
        const { templateId, to, variables } = req.body;

        // Get template from database
        const templateResult = await db(
          "SELECT * FROM email_templates WHERE id = $1",
          [templateId]
        );

        if (templateResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Email template not found",
          });
        }

        const template = templateResult.rows[0];

        // Send email using the service
        await emailService.sendTemplatedEmail(to, template, variables);

        // Log the email
        await db(
          `INSERT INTO email_logs (template_id, recipient_email, subject, content, status)
           VALUES ($1, $2, $3, $4, 'sent')`,
          [templateId, to, template.subject, template.content]
        );

        res.json({
          success: true,
          message: "Email sent successfully",
        });
      } catch (error) {
        logger.error("Error sending email:", error);
        res.status(500).json({ success: false, message: error.message });
      }
    },
  ],

  sendBulkEmail: [
    adminRequired,
    async (req, res) => {
      try {
        const { templateId, recipients } = req.body;

        // Get template from database
        const templateResult = await db(
          "SELECT * FROM email_templates WHERE id = $1",
          [templateId]
        );

        if (templateResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Email template not found",
          });
        }

        const template = templateResult.rows[0];

        // Queue emails for sending
        await emailService.sendBulkTemplatedEmail(recipients, template);

        res.json({
          success: true,
          message: `Bulk email queued for ${recipients.length} recipients`,
        });
      } catch (error) {
        logger.error("Error sending bulk email:", error);
        res.status(500).json({ success: false, message: error.message });
      }
    },
  ],

  getEmailLogs: async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      let query = "SELECT * FROM email_logs";
      const queryParams = [];

      if (status) {
        query += " WHERE status = $1";
        queryParams.push(status);
      }

      query +=
        " ORDER BY sent_at DESC LIMIT $" +
        (queryParams.length + 1) +
        " OFFSET $" +
        (queryParams.length + 2);
      queryParams.push(limit, offset);

      const result = await db(query, queryParams);

      const countResult = await db(
        "SELECT COUNT(*) FROM email_logs" +
          (status ? " WHERE status = $1" : ""),
        status ? [status] : []
      );

      res.json({
        success: true,
        logs: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      });
    } catch (error) {
      logger.error("Error fetching email logs:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
