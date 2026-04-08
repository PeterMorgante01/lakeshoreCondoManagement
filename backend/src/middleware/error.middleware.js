module.exports = (err, req, res, next) => {
  console.error("ERROR:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation error",
      details: Object.values(err.errors).map((e) => e.message)
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      error: "Duplicate key",
      details: err.keyValue
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      error: `Invalid ${err.path}`,
      details: err.value
    });
  }

  res.status(err.statusCode || 500).json({
    error: err.message || "Server error",
    details: err.details || null
  });
};