function sanitizeObject(target) {
  if (!target || typeof target !== "object") return;

  Object.keys(target).forEach((key) => {
    const value = target[key];

    if (key.startsWith("$") || key.includes(".")) {
      delete target[key];
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => sanitizeObject(entry));
      return;
    }

    if (value && typeof value === "object") {
      sanitizeObject(value);
    }
  });
}

function sanitizeInput(req, res, next) {
  sanitizeObject(req.body);
  sanitizeObject(req.params);

  // Express 5 exposes req.query via a getter. Mutate nested object only when present.
  if (req.query && typeof req.query === "object") {
    sanitizeObject(req.query);
  }

  next();
}

module.exports = sanitizeInput;
