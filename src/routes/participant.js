import { Router } from "express";
import cors from "cors";
import { participantController } from "../controllers/participant.controller.js";
import verifyAuth from "../middlewares/verifyAuth.js";
import { verifyAdmin } from "../middlewares/verifyAuth.js";

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  optionsSuccessStatus: 200,
};

const router = Router();

router.use(cors(corsOptions));

router.post("/register", participantController.registerParticipant);

router.get(
  "/registrations",
  verifyAuth,
  verifyAdmin,
  participantController.getRegistrations
);

router.get(
  "/registration/:id",
  verifyAuth,
  verifyAdmin,
  participantController.getRegistrationById
);

router.post(
  "/registration/:id/status",
  verifyAuth,
  verifyAdmin,
  participantController.updateRegistrationStatus
);

router.post(
  "/registration/:id/note",
  verifyAuth,
  verifyAdmin,
  participantController.addVerificationNote
);

router.post(
  "/registration/:registrationId/resend-email",
  verifyAuth,
  verifyAdmin,
  participantController.resendEmail
);

router.post(
  "/bulk-action",
  verifyAuth,
  verifyAdmin,
  participantController.bulkAction
);

router.post(
  "/registration/:id/verify",
  verifyAuth,
  verifyAdmin,
  participantController.verifyRegistration
);

router.get(
  "/registration/:id/verification-history",
  verifyAuth,
  verifyAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      // Replace db() with sql template literal
      const history = await sql`
        SELECT * FROM verification_history 
        WHERE registration_id = ${id} 
        ORDER BY created_at DESC
      `;

      res.status(200).json({
        success: true,
        history,
      });
    } catch (error) {
      logger.error(
        `Error fetching verification history for registration ${req.params.id}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Failed to fetch verification history",
      });
    }
  }
);

export default router;
