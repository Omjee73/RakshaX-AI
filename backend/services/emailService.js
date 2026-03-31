const nodemailer = require("nodemailer");

const env = require("../config/env");

let transporter;

function getTransporter() {
  if (!env.emailEnabled) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });

  return transporter;
}

async function sendHighRiskAlert({ to, scan }) {
  const mailer = getTransporter();
  if (!mailer || !to) return;

  const html = `
    <h2>RakshaX AI Alert</h2>
    <p>High-risk scam content detected in your recent scan.</p>
    <ul>
      <li><strong>Risk Score:</strong> ${scan.scamScore}%</li>
      <li><strong>Category:</strong> ${scan.category}</li>
      <li><strong>Recommendation:</strong> ${scan.recommendedAction}</li>
    </ul>
  `;

  await mailer.sendMail({
    from: env.smtpFrom || env.smtpUser,
    to,
    subject: "RakshaX AI Alert: High Risk Scan Detected",
    html
  });
}

async function sendVoteReportAlert({ to, voteType, scan, trustScore, scamConsensusScore, votes }) {
  const mailer = getTransporter();
  if (!mailer || !to || !scan) return;

  const voteLabel = voteType === "down" ? "Marked as Scam" : "Marked as Safe";
  const reportedItem = scan.analyzedUrl || scan.sourceUrl || scan.content?.slice(0, 320) || "N/A";
  const html = `
    <h2>RakshaX AI Community Mark Update</h2>
    <p>Your vote has been recorded for a scan report.</p>
    <ul>
      <li><strong>Email Sent To:</strong> ${to}</li>
      <li><strong>Your Mark:</strong> ${voteLabel}</li>
      <li><strong>Risk Score:</strong> ${scan.scamScore}% (${scan.verdict || "suspicious"})</li>
      <li><strong>Category:</strong> ${scan.category}</li>
      <li><strong>Community Safe Score:</strong> ${trustScore}%</li>
      <li><strong>Community Scam Score:</strong> ${scamConsensusScore || 0}%</li>
      <li><strong>Votes:</strong> Up ${votes?.up || 0}, Down ${votes?.down || 0}</li>
      <li><strong>Reported Item:</strong> ${reportedItem}</li>
      <li><strong>Input Type:</strong> ${scan.inputType || "N/A"}</li>
      <li><strong>Context Type:</strong> ${scan.contextType || "general"}</li>
      <li><strong>Explanation:</strong> ${scan.explanation}</li>
    </ul>
    <p><strong>Recommended Action:</strong> ${scan.recommendedAction}</p>
  `;

  await mailer.sendMail({
    from: env.smtpFrom || env.smtpUser,
    to,
    subject: "RakshaX AI: Vote Confirmation and Report Summary",
    html
  });
}

module.exports = { sendHighRiskAlert, sendVoteReportAlert };
