const ApiError = require("../utils/ApiError");

function validate(schema, source = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });

    if (error) {
      const details = error.details.map((item) => item.message);
      return next(new ApiError(400, "Validation failed", details));
    }

    req[source] = value;
    next();
  };
}

module.exports = validate;
