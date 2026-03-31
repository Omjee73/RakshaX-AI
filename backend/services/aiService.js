const axios = require("axios");

const env = require("../config/env");

const ALLOWED_CATEGORIES = new Set([
  "phishing",
  "job scam",
  "upi fraud",
  "investment fraud",
  "loan scam",
  "impersonation",
  "lottery scam",
  "other"
]);

const FALLBACK_RESPONSE = {
  scamScore: 65,
  confidence: 60,
  verdict: "suspicious",
  category: "other",
  providerUsed: "heuristic-engine",
  explanation:
    "Suspicious language patterns were detected. Please verify sender identity, URLs, and payment requests before taking action.",
  analysisSummary: "Insufficient trusted context was available from upstream AI providers.",
  redFlags: ["Unknown sender or context"],
  greenFlags: [],
  recommendedAction:
    "Do not click unknown links, avoid sharing OTP/UPI PIN, report the sender, and verify via official channels."
};

const SIGNAL_RULES = [
  { pattern: /\botp\b|one[ -]?time[ -]?password/i, weight: 18, category: "phishing", signal: "OTP request" },
  { pattern: /\bupi\b|\bupi id\b|\bvpa\b|@oksbi|@okicici|@okaxis|@paytm/i, weight: 22, category: "upi fraud", signal: "UPI payment context" },
  { pattern: /\bkbc\b|lottery|jackpot|prize money|won \$?\d+/i, weight: 20, category: "lottery scam", signal: "Lottery or prize claim" },
  { pattern: /\bjob\b|work from home|earn\s?\d+|data entry|registration fee|joining fee/i, weight: 20, category: "job scam", signal: "Suspicious job offer" },
  { pattern: /double your money|guaranteed returns|crypto signal|investment plan|trading group/i, weight: 20, category: "investment fraud", signal: "Unrealistic investment claim" },
  { pattern: /instant loan|processing fee|pre-approved loan|loan disbursal/i, weight: 18, category: "loan scam", signal: "Loan scam pattern" },
  { pattern: /urgent|immediately|within\s?\d+\s?(minutes|hours)|account (blocked|suspended|frozen)/i, weight: 14, category: "phishing", signal: "Urgency pressure language" },
  { pattern: /verify your account|kyc update|bank alert|sbi alert|aadhaar update|pan update/i, weight: 16, category: "phishing", signal: "Account verification lure" },
  { pattern: /click here|bit\.ly|tinyurl|shorturl|rb\.gy|t\.co\//i, weight: 14, category: "phishing", signal: "Shortened or suspicious link" },
  { pattern: /gift card|steam card|amazon card|voucher code|redeem code/i, weight: 16, category: "impersonation", signal: "Gift-card payment request" },
  { pattern: /dear customer|congratulations|selected winner|act now/i, weight: 10, category: "other", signal: "Generic scam phrasing" },
  { pattern: /\bpassword\b|\bpin\b|cvv|netbanking|ifsc/i, weight: 15, category: "phishing", signal: "Credential harvesting attempt" }
];

const ACTION_BY_CATEGORY = {
  phishing:
    "Open the official app/site manually, never via provided links. Change password, enable 2FA, and report the sender to 1930 cyber helpline.",
  "upi fraud":
    "Do not approve collect requests, never share UPI PIN/OTP, block sender, and report transaction attempt immediately in your UPI app.",
  "job scam":
    "Do not pay registration or onboarding fees. Verify recruiter domain and company contact using official career pages before proceeding.",
  "investment fraud":
    "Avoid guaranteed-return schemes. Verify platform registration and withdraw immediately if pressured for additional deposits.",
  "loan scam":
    "Never pay processing fees to personal accounts. Use RBI-registered lenders and validate via official customer care channels.",
  impersonation:
    "Verify identity using an independent channel (official phone/app). Do not send money, gift cards, or confidential details.",
  "lottery scam":
    "Legitimate lotteries do not ask upfront payment. Ignore, block, and report the message and linked accounts.",
  other:
    "Do not click unknown links or share sensitive data. Independently verify claims and report suspicious communication promptly."
};

function normalizeAiResponse(parsed) {
  const scamScore = Math.max(0, Math.min(100, Number(parsed.scamScore ?? 0)));
  const confidence = Math.max(0, Math.min(100, Number(parsed.confidence ?? 70)));
  const rawCategory = String(parsed.category || "other").toLowerCase().trim();
  const category = ALLOWED_CATEGORIES.has(rawCategory) ? rawCategory : "other";

  let verdict = String(parsed.verdict || "suspicious").toLowerCase().trim();
  if (!["safe", "suspicious", "scam"].includes(verdict)) {
    verdict = scamScore >= 75 ? "scam" : scamScore >= 35 ? "suspicious" : "safe";
  }

  const redFlags = Array.isArray(parsed.redFlags)
    ? parsed.redFlags.map((item) => String(item)).filter(Boolean).slice(0, 8)
    : [];
  const greenFlags = Array.isArray(parsed.greenFlags)
    ? parsed.greenFlags.map((item) => String(item)).filter(Boolean).slice(0, 8)
    : [];

  return {
    scamScore,
    confidence,
    verdict,
    category,
    providerUsed: String(parsed.providerUsed || "llm"),
    explanation: String(parsed.explanation || FALLBACK_RESPONSE.explanation),
    analysisSummary: String(parsed.analysisSummary || "Risk evaluated from message and URL indicators."),
    redFlags,
    greenFlags,
    recommendedAction: String(parsed.recommendedAction || FALLBACK_RESPONSE.recommendedAction)
  };
}

function buildPrompt({ inputType, contextType, content, sourceUrl, urlTitle = "", urlWarning = "" }) {
  return `You are RakshaX AI, a fraud-risk analyst for India-focused digital scams. Return strict JSON only with keys: scamScore (0-100), confidence (0-100), verdict (safe|suspicious|scam), category (phishing|job scam|upi fraud|investment fraud|loan scam|impersonation|lottery scam|other), analysisSummary, explanation, redFlags (string[]), greenFlags (string[]), recommendedAction.\n\nGuidelines:\n- Detect social engineering, payment pressure, account takeover, fake job offers, and impersonation markers.\n- Consider linguistic pressure, urgency, reward bait, and credential/payment requests.\n- Be conservative with known trusted domains and clear legal/policy language.\n- explanation must be detailed and evidence-based (2-4 lines).\n- recommendedAction must be practical and stepwise for Indian users.\n\nInputType: ${inputType}\nContextType: ${contextType}\nSourceURL: ${sourceUrl}\nURLTitle: ${urlTitle}\nURLWarning: ${urlWarning}\nContent: ${content}`;
}

function parseJsonFromModelOutput(raw) {
  if (!raw || typeof raw !== "string") {
    throw new Error("Model output is empty or not text");
  }

  const sanitized = raw.trim();
  const firstCurly = sanitized.indexOf("{");
  const lastCurly = sanitized.lastIndexOf("}");
  const jsonCandidate =
    firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly
      ? sanitized.slice(firstCurly, lastCurly + 1)
      : sanitized;

  return JSON.parse(jsonCandidate);
}

function extractUrls(text) {
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
  const matches = text.match(urlRegex);
  return matches || [];
}

function isShortenerHost(host) {
  const normalized = host.toLowerCase();
  return ["bit.ly", "tinyurl.com", "rb.gy", "t.co", "is.gd", "cutt.ly"].some(
    (domain) => normalized === domain || normalized.endsWith(`.${domain}`)
  );
}

function isTrustedHost(host) {
  const normalized = host.toLowerCase();
  return [
    "chatgpt.com",
    "openai.com",
    "google.com",
    "microsoft.com",
    "github.com",
    "sbi.co.in",
    "onlinesbi.sbi",
    "gov.in"
  ].some((domain) => normalized === domain || normalized.endsWith(`.${domain}`));
}

function scoreUrlRisk(url) {
  let risk = 0;
  const urlSignals = [];

  try {
    const parsed = new URL(url.startsWith("http") ? url : `http://${url}`);
    const host = parsed.hostname.toLowerCase();

    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      risk += 16;
      urlSignals.push("Raw IP address URL");
    }

    if (host.includes("xn--")) {
      risk += 14;
      urlSignals.push("Punycode domain");
    }

    if ((host.match(/-/g) || []).length >= 3) {
      risk += 10;
      urlSignals.push("Hyphen-heavy domain");
    }

    if (parsed.protocol === "http:") {
      risk += 8;
      urlSignals.push("Non-HTTPS URL");
    }

    if (isShortenerHost(host)) {
      risk += 14;
      urlSignals.push("URL shortener domain");
    }

    if (isTrustedHost(host)) {
      risk -= 18;
      urlSignals.push("Trusted domain reputation");
    }

    if (/verify|update|secure|wallet|bank|kyc|login/.test(parsed.pathname.toLowerCase())) {
      risk += 8;
      urlSignals.push("Credential-themed URL path");
    }
  } catch (error) {
    risk += 8;
    urlSignals.push("Malformed URL");
  }

  return { risk, urlSignals };
}

function generateHeuristicAnalysis({ inputType, contextType, content, sourceUrl, urlTitle = "", urlWarning = "" }) {
  const corpus = `${content || ""} ${sourceUrl || ""}`.trim();
  const categoryWeights = new Map();
  const triggeredSignals = [];
  const greenFlags = [];
  let score = 10;

  for (const rule of SIGNAL_RULES) {
    if (rule.pattern.test(corpus)) {
      score += rule.weight;
      categoryWeights.set(rule.category, (categoryWeights.get(rule.category) || 0) + rule.weight);
      triggeredSignals.push(rule.signal);
    }
  }

  if (/terms|conditions|privacy policy|refund policy/i.test(corpus) || contextType === "terms-conditions") {
    score -= 6;
    greenFlags.push("Document-style legal language detected");
  }

  if (/official website|help center|support portal/i.test(corpus)) {
    score -= 6;
    greenFlags.push("Reference to official support channels");
  }

  const urls = extractUrls(corpus);
  for (const url of urls.slice(0, 3)) {
    const { risk, urlSignals } = scoreUrlRisk(url);
    score += risk;
    if (risk > 0) {
      categoryWeights.set("phishing", (categoryWeights.get("phishing") || 0) + risk);
      triggeredSignals.push(...urlSignals);
    } else if (risk < 0) {
      greenFlags.push(...urlSignals.filter((signal) => signal.toLowerCase().includes("trusted")));
    }
  }

  if (urlTitle) {
    greenFlags.push(`Fetched page title: ${urlTitle}`);
  }
  if (urlWarning) {
    triggeredSignals.push(urlWarning);
    score += 10;
  }

  if (inputType === "image" && content && content.length < 20) {
    score += 8;
    triggeredSignals.push("Low OCR confidence or limited extracted context");
  }

  const sortedCategories = Array.from(categoryWeights.entries()).sort((a, b) => b[1] - a[1]);
  const category = sortedCategories[0]?.[0] || "other";
  const normalizedScore = Math.max(8, Math.min(95, Math.round(score)));
  const verdict = normalizedScore >= 75 ? "scam" : normalizedScore >= 35 ? "suspicious" : "safe";
  const confidence = Math.max(55, Math.min(92, 55 + triggeredSignals.length * 6));

  const topSignals = triggeredSignals.slice(0, 4);
  const uniqueRedFlags = Array.from(new Set(topSignals));
  const uniqueGreenFlags = Array.from(new Set(greenFlags.slice(0, 4)));
  const explanation = topSignals.length
    ? `Potential risk indicators found: ${topSignals.join(", ")}. This pattern commonly appears in ${category} campaigns.`
    : "No strong scam markers found, but caution is advised because unknown senders and unsolicited links can still be risky.";

  return {
    scamScore: normalizedScore,
    confidence,
    verdict,
    category,
    providerUsed: "heuristic-engine",
    analysisSummary:
      verdict === "safe"
        ? "Current evidence suggests low risk, but continue safe browsing practices."
        : "Message and/or URL signals indicate potential fraud behavior requiring caution.",
    explanation,
    redFlags: uniqueRedFlags,
    greenFlags: uniqueGreenFlags,
    recommendedAction: ACTION_BY_CATEGORY[category] || ACTION_BY_CATEGORY.other
  };
}

async function callAiPipeOpenRouter(prompt) {
  if (!env.aiPipeToken) return null;

  const response = await axios.post(
    `${env.aiPipeBaseUrl}/openrouter/v1/chat/completions`,
    {
      model: env.aiPipeOpenRouterModel,
      messages: [
        { role: "system", content: "Return only valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    },
    {
      headers: {
        Authorization: `Bearer ${env.aiPipeToken}`,
        "Content-Type": "application/json"
      },
      timeout: 18000
    }
  );

  const raw = response.data?.choices?.[0]?.message?.content;
  return normalizeAiResponse(parseJsonFromModelOutput(raw));
}

async function callOpenAi(prompt) {
  if (!env.openaiApiKey) return null;

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: env.openaiModel,
      messages: [
        { role: "system", content: "Return only valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    },
    {
      headers: {
        Authorization: `Bearer ${env.openaiApiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 15000
    }
  );

  const raw = response.data?.choices?.[0]?.message?.content;
  return normalizeAiResponse(parseJsonFromModelOutput(raw));
}

async function callOllama(prompt) {
  const response = await axios.post(
    `${env.ollamaBaseUrl}/api/generate`,
    {
      model: env.ollamaModel,
      prompt: `Return only valid JSON. ${prompt}`,
      stream: false,
      format: "json"
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 20000
    }
  );

  const raw = response.data?.response;
  return normalizeAiResponse(parseJsonFromModelOutput(raw));
}

async function tryProvider(providerName, runner) {
  try {
    const result = await runner();
    if (result) return result;
    return null;
  } catch (error) {
    if (env.nodeEnv !== "production") {
      console.warn(`[AI] Provider ${providerName} failed: ${error.message}`);
    }
    return null;
  }
}

async function analyzeScamContent({ inputType, contextType = "general", content, sourceUrl = "", urlTitle = "", urlWarning = "" }) {
  const prompt = buildPrompt({ inputType, contextType, content, sourceUrl, urlTitle, urlWarning });

  const apiFirst = env.aiStrategy !== "ollama-first";
  const sequence = apiFirst
    ? [
        () => tryProvider("aipipe-openrouter", () => callAiPipeOpenRouter(prompt)),
        () => tryProvider("openai", () => callOpenAi(prompt)),
        () => tryProvider("ollama", () => callOllama(prompt))
      ]
    : [
        () => tryProvider("ollama", () => callOllama(prompt)),
        () => tryProvider("aipipe-openrouter", () => callAiPipeOpenRouter(prompt)),
        () => tryProvider("openai", () => callOpenAi(prompt))
      ];

  const providers = env.aiStrategy !== "ollama-first"
    ? ["aipipe-openrouter", "openai", "ollama"]
    : ["ollama", "aipipe-openrouter", "openai"];

  for (let index = 0; index < sequence.length; index += 1) {
    const result = await sequence[index]();
    if (result) {
      return {
        ...result,
        providerUsed: result.providerUsed || providers[index]
      };
    }
  }

  return generateHeuristicAnalysis({ inputType, contextType, content, sourceUrl, urlTitle, urlWarning });
}

module.exports = { analyzeScamContent };
