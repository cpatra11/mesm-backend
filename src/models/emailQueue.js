import mongoose from "mongoose";

const emailQueueSchema = new mongoose.Schema({
  templateId: { type: String, required: true },
  recipients: [
    {
      email: String,
      variables: Map,
      status: {
        type: String,
        enum: ["pending", "sent", "failed"],
        default: "pending",
      },
      error: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  sentAt: Date,
  totalRecipients: Number,
  successCount: { type: Number, default: 0 },
  failureCount: { type: Number, default: 0 },
});

export default mongoose.model("EmailQueue", emailQueueSchema);
