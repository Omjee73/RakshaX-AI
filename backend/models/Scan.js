const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    inputType: { type: String, enum: ["text", "url", "image", "document"], required: true, index: true },
    contextType: {
      type: String,
      enum: [
        "general",
        "payment-request",
        "terms-conditions",
        "documents",
        "job-offer",
        "social-message",
        "email"
      ],
      default: "general",
      index: true
    },
    content: { type: String, required: true },
    scamScore: { type: Number, required: true, min: 0, max: 100, index: true },
    confidence: { type: Number, min: 0, max: 100, default: 60 },
    verdict: { type: String, enum: ["safe", "suspicious", "scam"], default: "suspicious" },
    category: {
      type: String,
      enum: [
        "phishing",
        "job scam",
        "upi fraud",
        "investment fraud",
        "loan scam",
        "impersonation",
        "lottery scam",
        "other"
      ],
      default: "other",
      index: true
    },
    explanation: { type: String, required: true },
    recommendedAction: { type: String, required: true },
    redFlags: [{ type: String }],
    greenFlags: [{ type: String }],
    providerUsed: { type: String, default: "ai-provider" },
    analysisSummary: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    analyzedUrl: { type: String, default: "" },
    analyzedUrlTitle: { type: String, default: "" },
    analyzedUrlWarning: { type: String, default: "" },
    ocrText: { type: String, default: "" },
    flaggedByCommunity: { type: Boolean, default: false }
  },
  { timestamps: true }
);

scanSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Scan", scanSchema);
