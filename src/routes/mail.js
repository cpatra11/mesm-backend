import { Router } from "express";
import { mailController } from "../controllers/mail.controller.js";
const router = Router();

router.get("/get", mailController.getMailTemplate);
router.put("/update", mailController.updateMailTemplate);

export default router;