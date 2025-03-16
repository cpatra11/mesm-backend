import logger from "../config/logger.js";
import { query as db, sql } from "../db/db.js";
import { emailService } from "../services/email.service.js";

export const participantController = {
  getParticipants: async (req, res, next) => {
    try {
      logger.info("Fetching participants...");
      const result = await db("SELECT * FROM users ORDER BY created_at DESC");

      logger.info(`Found ${result.rows.length} users`);
      console.log("First row sample:", result.rows[0]);

      res.status(200).json({ participants: result.rows });
    } catch (error) {
      logger.error("Error fetching users:", error);
      next(error);
    }
  },

  // register a participant (modified to handle URL directly)
  registerParticipant: async (req, res) => {
    try {
      const {
        eventTitle,
        eventCode,
        eventDay,
        eventTime,
        eventLocation,
        teamSize,
        teamLeadName,
        email,
        whatsappNumber,
        alternatePhone,
        college,
        upiTransectionId,
        paySS,
        participantNames,
      } = req.body;

      // Validate phone numbers
      const phonePattern = /^\d{10}$/;
      if (!phonePattern.test(whatsappNumber)) {
        return res.status(400).json({
          success: false,
          message: "WhatsApp number must be exactly 10 digits",
        });
      }

      if (alternatePhone && !phonePattern.test(alternatePhone)) {
        return res.status(400).json({
          success: false,
          message: "Alternate phone number must be exactly 10 digits",
        });
      }

      // Validate participantNames is an array
      if (!Array.isArray(participantNames)) {
        return res.status(400).json({
          success: false,
          message: "participantNames must be an array",
        });
      }

      // Extract names from participant objects
      const validParticipants = participantNames
        .map((participant) => participant?.name?.trim())
        .filter(Boolean);

      if (validParticipants.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one valid participant name is required",
        });
      }

      // Get team lead name from teamLeadName object or first participant
      const teamLead = teamLeadName?.name?.trim() || validParticipants[0];

      await sql`BEGIN`;

      // Format phone numbers to match database constraint
      const formattedWhatsapp = whatsappNumber.replace(/\D/g, "").slice(-10);
      const formattedAlternate = alternatePhone
        ? alternatePhone.replace(/\D/g, "").slice(-10)
        : null;

      const [registration] = await sql`
        INSERT INTO registrations (
          event_name, event_code, event_day, event_time, event_location,
          team_size, team_lead_name, email, whatsapp_number, alternate_phone,
          college, payment_screenshot_url, payment_status, status, upi_transaction_id
        ) VALUES (
          ${eventTitle}, ${eventCode}, ${eventDay}, ${eventTime}, ${eventLocation},
          ${teamSize}, ${teamLead}, ${email}, ${formattedWhatsapp},
          ${formattedAlternate}, ${college}, ${paySS}, 'PENDING', 'pending',
          ${upiTransectionId}
        )
        RETURNING *`;

      for (const name of validParticipants) {
        await sql`
          INSERT INTO participants (registration_id, name, is_team_lead)
          VALUES (${registration.id}, ${name}, ${name === teamLead})`;
      }

      await sql`COMMIT`;
      res.status(201).json({ success: true, registration });
    } catch (error) {
      await sql`ROLLBACK`;
      logger.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Registration failed",
      });
    }
  },

  // Get all registrations without pagination
  getRegistrations: async (req, res) => {
    try {
      logger.info("Fetching registrations...");
      const { day, event, status, search } = req.query;

      // Get all registrations with participant info using sql template literals
      const result = await sql`
        WITH ParticipantAgg AS (
          SELECT 
            registration_id,
            array_agg(name) as participant_names,
            count(*) as participant_count
          FROM participants
          GROUP BY registration_id
        )
        SELECT 
          r.*,
          COALESCE(p.participant_names, ARRAY[]::text[]) as participant_names,
          COALESCE(p.participant_count, 0) as participant_count
        FROM registrations r
        LEFT JOIN ParticipantAgg p ON r.id = p.registration_id
        ORDER BY r.created_at DESC
      `;

      res.status(200).json({
        success: true,
        registrations: result || [],
      });
    } catch (error) {
      logger.error("Error fetching registrations:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch registrations",
      });
    }
  },

  // Get a specific registration by ID with participants
  getRegistrationById: async (req, res) => {
    try {
      const { id } = req.params;

      // Get registration details
      const registrationResult = await db(
        `SELECT * FROM registrations WHERE id = $1`,
        [id]
      );

      if (registrationResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      // Get participants for this registration
      const participantsResult = await db(
        `SELECT * FROM participants WHERE registration_id = $1`,
        [id]
      );

      const registration = registrationResult.rows[0];
      registration.participants = participantsResult.rows;

      res.status(200).json({
        success: true,
        registration,
      });
    } catch (error) {
      logger.error(`Error fetching registration ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch registration details",
      });
    }
  },

  // Update registration status (approve/reject)
  updateRegistrationStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      await sql`BEGIN`;

      const result = await sql`
        UPDATE registrations 
        SET 
          status = ${status},
          updated_at = CURRENT_TIMESTAMP,
          rejection_reason = CASE 
            WHEN ${status} = 'rejected' THEN ${reason}
            ELSE rejection_reason
          END,
          payment_status = CASE 
            WHEN ${status} = 'approved' THEN 'COMPLETED'
            ELSE payment_status 
          END
        WHERE id = ${id}
        RETURNING *
      `;

      if (result.length === 0) {
        await sql`ROLLBACK`;
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      if (status === "approved") {
        await emailService.sendRegistrationStatusEmail(id, "approved");
      } else if (status === "rejected") {
        await emailService.sendRegistrationStatusEmail(id, "rejected", reason);
      }

      await sql`COMMIT`;

      res.status(200).json({
        success: true,
        message: `Registration ${status} successfully`,
        registration: result[0],
      });
    } catch (error) {
      await sql`ROLLBACK`;
      logger.error("Status update error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update status",
      });
    }
  },

  // Remove uploadScreenshot method since we don't need it anymore

  // Update updatePayment to handle URL
  updatePayment: async (req, res) => {
    try {
      const { registrationId } = req.params;
      const { upiTransactionId, paymentScreenshotUrl } = req.body;

      const [result] = await sql`
        UPDATE registrations 
        SET payment_status = 'pending',
            current_step = 'payment',
            upi_transaction_id = ${upiTransactionId},
            payment_screenshot_url = ${paymentScreenshotUrl},
            payment_date = CURRENT_TIMESTAMP,
            last_updated = CURRENT_TIMESTAMP
        WHERE id = ${registrationId}
        RETURNING *
      `;

      res.status(200).json({
        success: true,
        message: "Payment information updated",
        registration: result,
      });
    } catch (error) {
      logger.error("Payment update error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update payment information",
      });
    }
  },

  // Bulk actions (approve, reject, email)
  bulkAction: async (req, res) => {
    try {
      const { action, ids, templateId, variables } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No registrations selected",
        });
      }

      await db("BEGIN");

      // Get all registrations with participant info
      const registrations = await db(
        `SELECT r.*, 
                (SELECT string_agg(name, ', ') FROM participants WHERE registration_id = r.id) as participant_names
         FROM registrations r 
         WHERE r.id = ANY($1)`,
        [ids]
      );

      let results = [];

      for (const reg of registrations.rows) {
        try {
          const emailVars = {
            name: reg.team_lead_name,
            event: reg.event_name,
            eventDate: reg.event_day,
            eventLocation: reg.event_location,
            participants: reg.participant_names,
            registrationId: reg.id,
            ...variables,
          };

          await emailService.sendTemplatedEmail(
            reg.email,
            templateId,
            emailVars
          );
          results.push({ id: reg.id, status: "success" });
        } catch (error) {
          results.push({ id: reg.id, status: "failed", error: error.message });
        }
      }

      await db("COMMIT");
      res.status(200).json({
        success: true,
        results,
      });
    } catch (error) {
      await db("ROLLBACK");
      logger.error("Bulk action error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Add a new verification note to a registration
  addVerificationNote: async (req, res) => {
    try {
      const { id } = req.params;
      const { note } = req.body;

      if (!note || note.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Verification note cannot be empty",
        });
      }

      const registration = await db(
        `SELECT verification_notes FROM registrations WHERE id = $1`,
        [id]
      );

      if (registration.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      const currentNotes = registration.rows[0].verification_notes || "";
      const timestamp = new Date().toISOString();
      const adminName = req.user?.name || "Admin";
      const newNote = `[${timestamp}] ${adminName}: ${note}`;
      const updatedNotes = currentNotes
        ? `${currentNotes}\n\n${newNote}`
        : newNote;

      await db(
        `UPDATE registrations SET verification_notes = $1 WHERE id = $2`,
        [updatedNotes, id]
      );

      res.status(200).json({
        success: true,
        message: "Verification note added successfully",
      });
    } catch (error) {
      logger.error(
        `Error adding verification note for registration ${req.params.id}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to add verification note",
      });
    }
  },

  // Resend specific email
  resendEmail: async (req, res) => {
    try {
      const { registrationId } = req.params;
      const { templateType } = req.body;

      const registration = await db(
        `SELECT * FROM registrations WHERE id = $1`,
        [registrationId]
      );

      if (registration.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      // Call appropriate email method based on templateType
      let emailResult;

      switch (templateType) {
        case "approval":
          emailResult = await emailService.sendRegistrationStatusEmail(
            registrationId,
            "approved"
          );
          break;

        case "rejection":
          emailResult = await emailService.sendRegistrationStatusEmail(
            registrationId,
            "rejected",
            req.body.reason
          );
          break;

        case "payment_reminder":
          emailResult = await emailService.sendPaymentReminder(registrationId);
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Invalid email template type",
          });
      }

      res.status(200).json({
        success: true,
        message: `${templateType} email resent successfully`,
        result: emailResult,
      });
    } catch (error) {
      logger.error(
        `Error resending email for registration ${req.params.registrationId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to resend email",
      });
    }
  },

  // toggle approve status of a participant
  toggleApproveStatus: async (req, res) => {
    try {
      const { id, status } = req.query;
      const result = await db(
        "UPDATE users SET payment_status = $1 WHERE id = $2 RETURNING *",
        [status, id]
      );

      const participant = {
        id: result.rows[0].id,
        name: result.rows[0].name || "No name",
        email: result.rows[0].email,
        event: result.rows[0].event_title || "Not specified",
        status: result.rows[0].payment_status,
        created_at: result.rows[0].created_at,
        amount_paid: result.rows[0].payment_amount || 0,
        payment_method: result.rows[0].payment_method || "Not specified",
        phone: result.rows[0].phone || "Not provided",
        transaction_id: result.rows[0].transaction_id || "Not provided",
        transaction_screenshot: result.rows[0].payment_receipt_url || "",
      };

      logger.info(`User ${id} status updated to ${status}`);
      res.status(200).json({
        message: `User ${id} status updated to ${status}`,
        participant,
      });
    } catch (error) {
      logger.error("Error updating status:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  verifyRegistration: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const adminId = req.user.id;

      await db("BEGIN");

      // Get all participants for this registration
      const participantNames = await db(
        `SELECT string_agg(name, ', ') as names 
         FROM participants 
         WHERE registration_id = $1`,
        [id]
      );

      // Update registration verification status
      const result = await db(
        `UPDATE registrations 
         SET verification_status = $1,
             verified_by = $2,
             verified_at = CURRENT_TIMESTAMP,
             verification_notes = CASE 
               WHEN verification_notes IS NULL THEN $3
               ELSE verification_notes || E'\n' || $3
             END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [status, adminId, notes, id]
      );

      if (status === "approved") {
        // Send approval email with team members info
        await emailService.sendRegistrationStatusEmail(
          id,
          "approved",
          null,
          participantNames.rows[0]?.names
        );
      } else if (status === "rejected") {
        // Send rejection email with team members info
        await emailService.sendRegistrationStatusEmail(
          id,
          "rejected",
          notes,
          participantNames.rows[0]?.names
        );
      }

      await db("COMMIT");

      res.status(200).json({
        success: true,
        message: `Registration ${status} successfully`,
        registration: result.rows[0],
      });
    } catch (error) {
      await db("ROLLBACK");
      logger.error("Verification error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to verify registration",
      });
    }
  },
};
