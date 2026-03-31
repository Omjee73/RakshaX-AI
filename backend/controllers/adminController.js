const Scan = require("../models/Scan");
const Report = require("../models/Report");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const getAdminOverview = asyncHandler(async (req, res) => {
  const [totalUsers, totalScans, totalReports, highRiskScans] = await Promise.all([
    User.countDocuments(),
    Scan.countDocuments(),
    Report.countDocuments(),
    Scan.countDocuments({ scamScore: { $gte: 75 } })
  ]);

  const flaggedContent = await Scan.find({ flaggedByCommunity: true }).sort({ createdAt: -1 }).limit(50);

  res.status(200).json({
    metrics: { totalUsers, totalScans, totalReports, highRiskScans },
    flaggedContent
  });
});

const updateFlagStatus = asyncHandler(async (req, res) => {
  const { scanId, flagged } = req.body;
  const scan = await Scan.findByIdAndUpdate(scanId, { flaggedByCommunity: !!flagged }, { new: true });

  res.status(200).json({ scan });
});

module.exports = { getAdminOverview, updateFlagStatus };
