import mongoose from "mongoose";
import {
  RegistrationStatus,
  PaymentStatus,
} from "../types/registration.types.js";

const registrationSchema = new mongoose.Schema(
  {
    eventTitle: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    whatsappNumber: {
      type: String,
      required: true,
    },
    alternatePhone: String,
    college: {
      type: String,
      required: true,
    },
    upiTransactionId: {
      type: String,
      required: true,
    },
    paymentScreenshotUrl: {
      type: String,
      required: true,
    },
    participantNames: [
      {
        name: {
          type: String,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: Object.values(RegistrationStatus),
      default: RegistrationStatus.PENDING,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export const Registration = mongoose.model("Registration", registrationSchema);
