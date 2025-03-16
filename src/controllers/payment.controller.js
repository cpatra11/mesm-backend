import { PaymentService } from "../services/payment.service.js";
import logger from "../config/logger.js";

export class PaymentController {
  static async initiatePayment(req, res) {
    try {
      // Add CORS headers explicitly
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Origin", req.headers.origin);

      const { amount, registrationId } = req.body;

      if (!amount || !registrationId) {
        return res.status(400).json({
          success: false,
          message: "Missing required payment information",
        });
      }

      // Create payment and link to registration
      const result = await PaymentService.createPayment(amount, {
        registrationId,
        paymentMethod: "ALL_METHODS",
        redirectMode: "REDIRECT",
        enableRetry: true,
        paymentTimeout: 600,
      });

      res.json({
        success: true,
        transactionId: result.transactionId,
        paymentUrl: result.paymentUrl,
      });
    } catch (error) {
      logger.error("Payment initiation failed:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Payment initiation failed",
      });
    }
  }

  static async verifyPayment(req, res) {
    try {
      // Get transactionId from either params or query
      const transactionId = req.params.transactionId || req.query.txnId;
      const paymentResponse = req.body;

      if (!transactionId) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID is required",
        });
      }

      logger.info("Payment callback received:", {
        transactionId,
        body: paymentResponse,
        method: req.method,
        query: req.query,
      });

      // For GET requests, redirect to appropriate URL
      if (req.method === "GET") {
        // Check payment status
        const status = await PaymentService.getPaymentStatus(transactionId);
        const redirectUrl =
          status?.status === "completed"
            ? process.env.PHONEPE_SUCCESS_URL
            : process.env.PHONEPE_FAILURE_URL;

        return res.redirect(`${redirectUrl}?id=${transactionId}`);
      }

      // For POST requests, process verification
      const result = await PaymentService.verifyPayment(transactionId, {
        status:
          paymentResponse.code === "PAYMENT_SUCCESS" ? "completed" : "failed",
        phonepeTransactionId: paymentResponse.providerReferenceId,
        amount: paymentResponse.amount,
        merchantId: paymentResponse.merchantId,
        code: paymentResponse.code,
        callbackTime: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        status: result.status,
        message: "Payment verification completed",
      });
    } catch (error) {
      logger.error("Payment verification failed:", error);
      // For GET requests, redirect to failure URL on error
      if (req.method === "GET") {
        return res.redirect(
          `${process.env.PHONEPE_FAILURE_URL}?error=verification_failed`
        );
      }
      return res.status(500).json({
        success: false,
        message: "Payment verification failed",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  static async getPaymentStatus(req, res) {
    try {
      const { transactionId } = req.params;
      const status = await PaymentService.getPaymentStatus(transactionId);
      res.json(status);
    } catch (error) {
      logger.error("Payment status check failed:", error);
      res.status(500).json({ error: "Payment status check failed" });
    }
  }

  static async checkPaymentStatus(req, res) {
    try {
      const { transactionId } = req.params;
      const status = await PaymentService.checkPaymentStatus(transactionId);

      if (status.success === true) {
        return res.redirect(process.env.PHONEPE_SUCCESS_URL);
      } else {
        return res.redirect(process.env.PHONEPE_FAILURE_URL);
      }
    } catch (error) {
      logger.error("Payment status check failed:", error);
      res.redirect(process.env.PHONEPE_FAILURE_URL);
    }
  }

  static async initiateTestPayment(req, res) {
    try {
      const { amount } = req.body;

      if (!amount) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const result = await PaymentService.createTestPayment(amount);

      res.json({
        success: true,
        transactionId: result.transactionId,
        paymentUrl: result.paymentUrl,
      });
    } catch (error) {
      logger.error("Test payment initiation failed:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Test payment failed",
      });
    }
  }

  static async verifyTestPayment(req, res) {
    try {
      const { transactionId } = req.params;
      const result = await PaymentService.verifyTestPayment(transactionId);
      res.json({ success: true, ...result });
    } catch (error) {
      logger.error("Test payment verification failed:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getTestPaymentStatus(req, res) {
    try {
      const { transactionId } = req.params;
      const status = await PaymentService.getTestPaymentStatus(transactionId);
      res.json({ success: true, status });
    } catch (error) {
      logger.error("Test payment status check failed:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
