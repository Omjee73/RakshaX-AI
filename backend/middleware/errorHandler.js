const env = require("../config/env");

function errorHandler(err, req, res, next) {
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
