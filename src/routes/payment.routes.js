import express from "express";
import { PaymentController } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/initiate", PaymentController.initiatePayment);
router.post("/verify/:transactionId", PaymentController.verifyPayment);
router.get("/status/:transactionId", PaymentController.getPaymentStatus);

export default router;
