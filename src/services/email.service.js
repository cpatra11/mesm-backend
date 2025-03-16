import nodemailer from "nodemailer";
import logger from "../config/logger.js";
import { query as db, sql } from "../db/db.js";

// Set up transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const emailService = {
  processTemplate(content, variables) {
    try {
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, "g");
          content = content.replace(regex, value || "");
        });
      }
      return content;
    } catch (error) {
      console.error("Error processing email template:", error);
      return content;
    }
  },

  async sendVerificationEmail(to, otp) {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: "Verify Your Admin Access",
        html: `
          <h1>Admin Verification Required</h1>
          <p>Your verification code is: <strong>${otp}</strong></p>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });

      logger.info(`Verification email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error("Email sending failed:", error);
      throw error;
    }
  },

  async sendLoginNotification(to, loginTime, ipAddress) {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: "New Admin Login Detected",
        html: `
          <h1>New Admin Login Alert</h1>
          <p>A new login was detected for your admin account.</p>
          <p>Time: ${loginTime}</p>
          <p>IP Address: ${ipAddress}</p>
          <p>If this wasn't you, please contact support immediately.</p>
        `,
      });

      logger.info(`Login notification email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error("Login notification email failed:", error);
      throw error;
    }
  },

  // Send email using a template and variables
  async sendTemplatedEmail(to, template, variables) {
    try {
      const subject = this.processTemplate(template.subject, variables);
      const html = this.processTemplate(template.content, variables);

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      });

      logger.info(`Templated email sent: ${info.messageId} to ${to}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send templated email to ${to}:`, error);
      throw error;
    }
  },

  // Enhanced method for bulk sending of emails with more comprehensive data
  async sendBulkTemplatedEmail(recipients, template) {
    try {
      // Create a record in the database for this bulk email
      const bulkEmailResult = await db(
        `INSERT INTO email_logs (template_id, recipient_email, subject, content, status)
         VALUES ($1, $2, $3, $4, 'queued')
         RETURNING id`,
        [template.id, "multiple-recipients", template.subject, template.content]
      );

      const bulkEmailId = bulkEmailResult.rows[0].id;

      // Process emails in batches of 10
      const batchSize = 10;
      let successCount = 0;
      let failureCount = 0;
      const results = [];

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (recipient) => {
            try {
              const subject = this.processTemplate(
                template.subject,
                recipient.variables
              );
              const html = this.processTemplate(
                template.content,
                recipient.variables
              );

              await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: recipient.email,
                subject,
                html,
              });

              // Log individual email success
              const logResult = await db(
                `INSERT INTO email_logs (template_id, recipient_email, subject, content, status, bulk_email_id, registration_id)
                VALUES ($1, $2, $3, $4, 'sent', $5, $6)
                RETURNING id`,
                [
                  template.id,
                  recipient.email,
                  subject,
                  html,
                  bulkEmailId,
                  recipient.registrationId,
                ]
              );

              // Update registration email status if registrationId is provided
              if (recipient.registrationId) {
                await db(
                  `UPDATE registrations 
                   SET last_email_sent = $1, 
                       last_email_sent_at = CURRENT_TIMESTAMP,
                       email_status = 'sent'
                   WHERE id = $2`,
                  [template.name, recipient.registrationId]
                );
              }

              successCount++;
              results.push({
                email: recipient.email,
                status: "sent",
                logId: logResult.rows[0].id,
              });
            } catch (error) {
              logger.error(
                `Failed to send email to ${recipient.email}:`,
                error
              );

              // Log individual email failure
              await db(
                `INSERT INTO email_logs (template_id, recipient_email, subject, content, status, error_message, bulk_email_id, registration_id)
                VALUES ($1, $2, $3, $4, 'failed', $5, $6, $7)`,
                [
                  template.id,
                  recipient.email,
                  template.subject,
                  template.content,
                  error.message,
                  bulkEmailId,
                  recipient.registrationId,
                ]
              );

              // Update registration email status if registrationId is provided
              if (recipient.registrationId) {
                await db(
                  `UPDATE registrations 
                   SET email_status = 'failed'
                   WHERE id = $1`,
                  [recipient.registrationId]
                );
              }

              failureCount++;
              results.push({
                email: recipient.email,
                status: "failed",
                error: error.message,
              });
            }
          })
        );
      }

      // Update bulk email record
      await db(
        `UPDATE email_logs 
         SET status = 'completed', 
             error_message = $1
         WHERE id = $2`,
        [`Success: ${successCount}, Failed: ${failureCount}`, bulkEmailId]
      );

      return {
        success: true,
        totalSent: successCount,
        totalFailed: failureCount,
        results: results,
      };
    } catch (error) {
      logger.error("Bulk email sending failed:", error);
      throw error;
    }
  },

  // Enhanced method to send registration status email with more variables
  async sendRegistrationStatusEmail(
    registrationId,
    status,
    reason = null,
    teamMembers = null
  ) {
    try {
      // Get comprehensive registration details with participant info
      const registrationResult = await sql`
        SELECT r.*, 
               r.team_lead_name as name, 
               r.event_name as event,
               r.event_day as event_date,
               r.event_time as event_time,
               r.event_location,
               r.college,
               r.team_size,
               r.payment_status,
               COALESCE(
                 (SELECT string_agg(name, ', ') FROM participants WHERE registration_id = r.id),
                 r.team_lead_name
               ) as all_participants
        FROM registrations r
        WHERE r.id = ${registrationId}
      `;

      if (registrationResult.length === 0) {
        throw new Error(`Registration not found: ${registrationId}`);
      }

      const registration = registrationResult[0];

      // Get appropriate template
      const templateName =
        status === "approved"
          ? "registration_approval"
          : "registration_rejection";

      const templateResult = await sql`
        SELECT * FROM email_templates WHERE name = ${templateName}
      `;

      if (!templateResult[0]) {
        throw new Error(`Email template not found: ${templateName}`);
      }

      const template = templateResult[0];

      // Prepare comprehensive variables
      const variables = {
        name: registration.name,
        event: registration.event,
        eventDate: registration.event_date,
        eventTime: registration.event_time,
        eventLocation: registration.event_location,
        college: registration.college,
        teamSize: registration.team_size,
        paymentStatus: registration.payment_status,
        registrationId: registrationId,
        allParticipants: registration.all_participants || registration.name,
      };

      if (status === "rejected" && reason) {
        variables.reason = reason;
      }

      // Send email
      await this.sendTemplatedEmail(registration.email, template, variables);

      // Log email using template literals instead of parameterized query
      const logResult = await sql`
        INSERT INTO email_logs (
          template_id, 
          recipient_email, 
          subject, 
          content, 
          status, 
          registration_id
        ) 
        VALUES (
          ${template.id}, 
          ${registration.email}, 
          ${template.subject}, 
          ${template.content}, 
          'sent',
          ${registrationId}
        )
        RETURNING id
      `;

      // Update registration with email status - already using template literals
      await sql`
        UPDATE registrations 
        SET last_email_sent = ${templateName},
            last_email_sent_at = CURRENT_TIMESTAMP,
            email_status = 'sent'
        WHERE id = ${registrationId}
      `;

      return {
        success: true,
        emailId: logResult[0].id,
      };
    } catch (error) {
      logger.error(
        `Failed to send registration status email for ID ${registrationId}:`,
        error
      );

      // Update registration with failed email status
      await sql`
        UPDATE registrations 
        SET email_status = 'failed'
        WHERE id = ${registrationId}
      `;

      throw error;
    }
  },

  // New method to send personalized reminder emails
  async sendPaymentReminder(registrationId) {
    try {
      const registrationResult = await sql`
        SELECT * FROM registrations 
        WHERE id = ${registrationId} 
        AND payment_status = 'pending'
      `;

      if (registrationResult.length === 0) {
        throw new Error(
          `No pending registration found with ID: ${registrationId}`
        );
      }

      const registration = registrationResult[0];

      const templateResult = await sql`
        SELECT * FROM email_templates 
        WHERE name = 'payment_reminder'
      `;

      if (!templateResult[0]) {
        throw new Error("Payment reminder template not found");
      }

      const template = templateResult[0];

      const variables = {
        name: registration.team_lead_name,
        event: registration.event_name,
        eventDate: registration.event_day,
        eventTime: registration.event_time,
        eventLocation: registration.event_location,
        registrationId: registrationId,
      };

      await this.sendTemplatedEmail(registration.email, template, variables);

      // Update registration with reminder sent
      await sql`
        UPDATE registrations 
        SET last_email_sent = 'payment_reminder',
            last_email_sent_at = CURRENT_TIMESTAMP,
            email_status = 'sent'
        WHERE id = ${registrationId}
      `;

      return { success: true };
    } catch (error) {
      logger.error(
        `Failed to send payment reminder for registration ${registrationId}:`,
        error
      );
      throw error;
    }
  },

  async getEmailQueue(page = 1, limit = 10) {
    return EmailQueue.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  },
};
