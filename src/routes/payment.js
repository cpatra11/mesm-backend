import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.js";
import path from "path";

const router = Router();

// Remove individual CORS config and use app-wide CORS
router.post("/initiate", PaymentController.initiatePayment);
router.all("/verify", PaymentController.verifyPayment);
router.all("/verify/:transactionId", PaymentController.verifyPayment);
router.get("/status/:transactionId", PaymentController.getPaymentStatus);

// Test routes - development only
if (process.env.NODE_ENV === "development") {
  router.post("/test/initiate", PaymentController.initiateTestPayment);
  router.post(
    "/test/verify/:transactionId",
    PaymentController.verifyTestPayment
  );
  router.get(
    "/test/status/:transactionId",
    PaymentController.getTestPaymentStatus
  );
  router.get("/test/simulator", (req, res) => {
    res.sendFile(path.join(process.cwd(), "src", "views", "payment-test.html"));
  });
}

export default router;
