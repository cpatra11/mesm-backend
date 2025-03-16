import crypto from "crypto";
import { query } from "../db/db.js";
import { PaymentStatus } from "../types/payment.types.js";
import logger from "../config/logger.js";
import axios from "axios";
import fs from "fs/promises";
import path from "path";

const {
  PHONEPE_MERCHANT_KEY,
  PHONEPE_MERCHANT_ID,
  PHONEPE_BASE_URL,
  FRONTEND_URL,
} = process.env;

export class PaymentService {
  static async createPayment(userId, amount, options = {}) {
    try {
      const transactionId = crypto.randomBytes(16).toString("hex");
      const amountInPaise = Math.round(Number(amount) * 100);

      const paymentPayload = {
        merchantId: PHONEPE_MERCHANT_ID,
        merchantTransactionId: transactionId,
        amount: amountInPaise,
        redirectUrl: `${process.env.PHONEPE_REDIRECT_URL}?txnId=${transactionId}`,
        redirectMode: "REDIRECT",
        callbackUrl: `${process.env.PHONEPE_CALLBACK_URL}?txnId=${transactionId}`,
        paymentInstrument: {
          type: "PAY_PAGE",
        },
      };

      const payload = Buffer.from(JSON.stringify(paymentPayload)).toString(
        "base64"
      );
      const keyIndex = 1;
      const string = payload + "/pg/v1/pay" + PHONEPE_MERCHANT_KEY;
      const sha256 = crypto.createHash("sha256").update(string).digest("hex");
      const checksum = sha256 + "###" + keyIndex;

      // Make request to PhonePe
      const response = await axios.post(
        `${PHONEPE_BASE_URL}/pg/v1/pay`,
        { request: payload },
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
          },
        }
      );

      // Save transaction record
      await query(
        `INSERT INTO transactions (transaction_id, user_id, amount, status)
         VALUES ($1, $2, $3, $4)`,
        [transactionId, userId, amount, PaymentStatus.PENDING]
      );

      return {
        success: true,
        transactionId,
        paymentUrl: response.data.data.instrumentResponse.redirectInfo.url,
      };
    } catch (error) {
      logger.error("Payment creation failed:", error);
      throw error;
    }
  }

  static async verifyPayment(transactionId, paymentResponse) {
    try {
      // Save detailed payment response
      await query(
        `UPDATE transactions 
         SET status = $1,
             phonepe_transaction_id = $2,
             amount_paid = $3,
             merchant_id = $4,
             response_code = $5,
             callback_time = $6,
             payment_verified = true,
             provider_reference_id = $7,
             provider_response = $8,
             payment_type = $9,
             updated_at = NOW()
         WHERE transaction_id = $10
         RETURNING *`,
        [
          paymentResponse.status,
          paymentResponse.phonepeTransactionId,
          paymentResponse.amount,
          paymentResponse.merchantId,
          paymentResponse.code,
          paymentResponse.callbackTime,
          paymentResponse.providerReferenceId,
          JSON.stringify(paymentResponse),
          paymentResponse.isTest ? "test" : "regular",
          transactionId,
        ]
      );

      // Update registration status if exists
      await query(
        `UPDATE registrations 
         SET payment_status = $1,
             payment_verified = true,
             payment_verified_at = NOW()
         WHERE id IN (
           SELECT registration_id 
           FROM transactions 
           WHERE transaction_id = $2
         )`,
        [paymentResponse.status, transactionId]
      );

      // Log the callback data
      const callbackPath = path.join(
        process.cwd(),
        "src",
        "data",
        "pay-callback.json"
      );

      let callbackData;
      try {
        const fileContent = await fs.readFile(callbackPath, "utf8");
        callbackData = JSON.parse(fileContent);
      } catch (error) {
        callbackData = { callbacks: [] };
      }

      // Add new callback data with more details
      callbackData.callbacks.push({
        transactionId,
        timestamp: new Date().toISOString(),
        ...paymentResponse,
        verificationStatus: "success",
      });

      await fs.writeFile(callbackPath, JSON.stringify(callbackData, null, 2));

      return {
        status: paymentResponse.status,
        transactionId,
        phonepeTransactionId: paymentResponse.phonepeTransactionId,
        verifiedAt: paymentResponse.callbackTime,
      };
    } catch (error) {
      logger.error("Payment verification failed:", error);

      // Log error details
      await query(
        `UPDATE transactions 
         SET error_code = $1,
             error_message = $2,
             retry_count = retry_count + 1,
             last_retry_at = NOW()
         WHERE transaction_id = $3`,
        [error.code || "UNKNOWN", error.message, transactionId]
      );

      throw error;
    }
  }

  static async getPaymentStatus(transactionId) {
    try {
      const result = await query(
        "SELECT * FROM transactions WHERE transaction_id = $1",
        [transactionId]
      );
      return result.rows[0];
    } catch (error) {
      logger.error("Payment status check failed:", error);
      throw error;
    }
  }

  static async checkPaymentStatus(transactionId) {
    try {
      const string = `/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}/${transactionId}${process.env.PHONEPE_SALT_KEY}`;
      const sha256 = crypto.createHash("sha256").update(string).digest("hex");
      const checksum = `${sha256}###${process.env.PHONEPE_SALT_INDEX}`;

      const response = await axios.get(
        `${process.env.PHONEPE_API_URL}/status/${process.env.PHONEPE_MERCHANT_ID}/${transactionId}`,
        {
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
            "X-MERCHANT-ID": process.env.PHONEPE_MERCHANT_ID,
          },
        }
      );

      return response.data;
    } catch (error) {
      logger.error("Payment status check failed:", error);
      throw error;
    }
  }

  static async createTestPayment(userId, amount) {
    try {
      if (!userId || !amount) {
        throw new Error("Missing required payment information");
      }

      const amountInPaise = Math.round(Number(amount) * 100);
      if (isNaN(amountInPaise) || amountInPaise <= 0) {
        throw new Error("Invalid payment amount");
      }

      const transactionId = crypto.randomBytes(16).toString("hex");

      // Create test transaction record with modified query
      await query(
        `INSERT INTO transactions 
         (transaction_id, user_id, amount, status) 
         VALUES ($1, $2, $3, $4)`,
        [transactionId, userId, amount, PaymentStatus.PENDING]
      );

      // Update the record to set is_test flag
      await query(
        `UPDATE transactions 
         SET is_test = true 
         WHERE transaction_id = $1`,
        [transactionId]
      );

      return {
        success: true,
        transactionId,
        paymentUrl: `${process.env.FRONTEND_URL}/payment/test/simulator?amount=${amountInPaise}&id=${transactionId}`,
      };
    } catch (error) {
      logger.error("Test payment creation failed:", error);
      throw error;
    }
  }

  static async verifyTestPayment(transactionId) {
    try {
      const result = await query(
        `UPDATE transactions 
         SET status = $1, updated_at = NOW() 
         WHERE transaction_id = $2 AND is_test = true
         RETURNING *`,
        [PaymentStatus.SUCCESS, transactionId]
      );

      if (!result.rows[0]) {
        throw new Error("Test transaction not found");
      }

      return { status: PaymentStatus.SUCCESS, transactionId };
    } catch (error) {
      logger.error("Test payment verification failed:", error);
      throw error;
    }
  }

  static async getTestPaymentStatus(transactionId) {
    try {
      const result = await query(
        `SELECT * FROM transactions 
         WHERE transaction_id = $1 AND is_test = true`,
        [transactionId]
      );

      return result.rows[0];
    } catch (error) {
      logger.error("Test payment status check failed:", error);
      throw error;
    }
  }
}
