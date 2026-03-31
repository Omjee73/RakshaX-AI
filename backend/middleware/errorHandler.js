const env = require("../config/env");
const multer = require("multer");

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "File too large. Maximum upload size is 20MB.",
        details: null,
        stack: env.nodeEnv === "production" ? undefined : err.stack
      });
    }

    return res.status(400).json({
      message: err.message || "Upload failed",
      details: null,
      stack: env.nodeEnv === "production" ? undefined : err.stack
    });
  }

  const statusCode = err.statusCode || 500;

  if (env.nodeEnv !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    message: err.message || "Something went wrong",
    details: err.details || null,
    stack: env.nodeEnv === "production" ? undefined : err.stack
  });
}

module.exports = errorHandler;
