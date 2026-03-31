const Report = require("../models/Report");
const Scan = require("../models/Scan");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendVoteReportAlert } = require("../services/emailService");

const voteReport = asyncHandler(async (req, res) => {
  const {
    scanId,
    voteType,
    tags = [],
    includeAccountEmail = true,
    additionalEmails = []
  } = req.body;

  const scan = await Scan.findById(scanId);
  if (!scan) {
    throw new ApiError(404, "Scan not found");
  }

  let report = await Report.findOne({ scanId });
  if (!report) {
    report = await Report.create({ scanId, tags: [] });
  }

  const existingVote = report.voters.find((v) => String(v.userId) === String(req.user._id));

  if (existingVote && existingVote.voteType !== voteType) {
    report.votes[existingVote.voteType] = Math.max(0, report.votes[existingVote.voteType] - 1);
  }

  if (!existingVote) {
    report.voters.push({ userId: req.user._id, voteType });
    report.votes[voteType] += 1;
  } else if (existingVote.voteType !== voteType) {
    existingVote.voteType = voteType;
    report.votes[voteType] += 1;
  }

  if (tags.length) {
    const mergedTags = new Set([...(report.tags || []), ...tags]);
    report.tags = Array.from(mergedTags);
  }

  await report.save();

  const totalVotes = Math.max(1, report.votes.up + report.votes.down);
  const trustScore = Math.round((report.votes.up / totalVotes) * 100);
  const scamConsensusScore = Math.round((report.votes.down / totalVotes) * 100);
  scan.flaggedByCommunity = report.votes.down > report.votes.up;
  await scan.save();

  const recipients = new Set();
  if (includeAccountEmail && req.user.email) {
    recipients.add(String(req.user.email).toLowerCase().trim());
  }
  for (const email of additionalEmails) {
    recipients.add(String(email).toLowerCase().trim());
  }

  const recipientList = Array.from(recipients).filter(Boolean);
  await Promise.all(
    recipientList.map((to) =>
      sendVoteReportAlert({
        to,
        voteType,
        scan,
        trustScore,
        scamConsensusScore,
        votes: report.votes
      }).catch(() => null)
    )
  );

  res.status(200).json({
    report: {
      ...report.toObject(),
      trustScore,
      scamConsensusScore
    },
    notifications: {
      requested: recipientList.length,
      recipients: recipientList
    }
  });
});

const getReportByScanId = asyncHandler(async (req, res) => {
  const report = await Report.findOne({ scanId: req.params.scanId });
  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  const totalVotes = Math.max(1, report.votes.up + report.votes.down);
  const trustScore = Math.round((report.votes.up / totalVotes) * 100);
  const scamConsensusScore = Math.round((report.votes.down / totalVotes) * 100);
  res.status(200).json({ report: { ...report.toObject(), trustScore, scamConsensusScore } });
});

module.exports = { voteReport, getReportByScanId };
