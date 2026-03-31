const asyncHandler = require("../utils/asyncHandler");
const { getTrendSummary } = require("../services/trendService");

const getTrends = asyncHandler(async (req, res) => {
  const days = Number(req.query.days || 14);
  const trends = await getTrendSummary(days);
  res.status(200).json({ trends });
});

module.exports = { getTrends };
