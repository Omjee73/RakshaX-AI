const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rakshaxai",
  jwtSecret: process.env.JWT_SECRET || "change_this_in_production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  aiStrategy: process.env.AI_STRATEGY || "api-first",
  aiPipeToken: process.env.AIPIPE_TOKEN || "",
  aiPipeOpenRouterModel: process.env.AIPIPE_OPENROUTER_MODEL || "openai/gpt-4.1",
  aiPipeBaseUrl: process.env.AIPIPE_BASE_URL || "https://aipipe.org",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
  ollamaModel: process.env.OLLAMA_MODEL || "llama3.1:8b",
  redisUrl: process.env.REDIS_URL || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  emailEnabled: process.env.EMAIL_ALERTS_ENABLED === "true",
  smtpHost: process.env.MAIL_SERVER || process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587),
  smtpSecure:
    String(process.env.MAIL_USE_TLS || "").toLowerCase() === "true"
      ? false
      : Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587) === 465,
  smtpUser: process.env.MAIL_USERNAME || process.env.SMTP_USER || "",
  smtpPass: process.env.MAIL_PASSWORD || process.env.SMTP_PASS || "",
  smtpFrom: process.env.MAIL_FROM || process.env.SMTP_FROM || ""
};
