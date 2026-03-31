const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const errorHandler = require("./middleware/errorHandler");
const sanitizeInput = require("./middleware/sanitizeInput");
const sanitizeXss = require("./middleware/sanitizeXss");
const authRoutes = require("./routes/authRoutes");
const scanRoutes = require("./routes/scanRoutes");
const reportRoutes = require("./routes/reportRoutes");
const adminRoutes = require("./routes/adminRoutes");
const trendRoutes = require("./routes/trendRoutes");

const app = express();

app.use(
  cors({
    origin: env.corsOrigin.split(",").map((item) => item.trim()),
    credentials: true
  })
);
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInput);
app.use(sanitizeXss);
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." }
});

app.use("/api", limiter);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "RakshaX AI API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/trends", trendRoutes);

app.use(errorHandler);

module.exports = app;
