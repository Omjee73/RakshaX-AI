function sanitizeString(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeValue(value) {
  if (typeof value === "string") return sanitizeString(value);

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry));
  }

  if (value && typeof value === "object") {
    const cloned = {};
    Object.keys(value).forEach((key) => {
      cloned[key] = sanitizeValue(value[key]);
    });
    return cloned;
  }

  return value;
}

function sanitizeXss(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }

  if (req.params && typeof req.params === "object") {
    req.params = sanitizeValue(req.params);
  }

  if (req.query && typeof req.query === "object") {
    Object.keys(req.query).forEach((key) => {
      req.query[key] = sanitizeValue(req.query[key]);
    });
  }

  next();
}

module.exports = sanitizeXss;
