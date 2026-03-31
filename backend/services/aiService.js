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

const DEFAULT_EXPLANATION =
  "AI model returned incomplete reasoning. Verify sender identity, payment requests, and URLs through official channels.";
const DEFAULT_RECOMMENDED_ACTION =
  "Do not share OTP, UPI PIN, CVV, or passwords. Independently verify claims and report suspicious communication.";


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
    providerUsed: String(parsed.providerUsed || "ai-provider"),
    explanation: String(parsed.explanation || DEFAULT_EXPLANATION),
    analysisSummary: String(parsed.analysisSummary || "Risk evaluated from message and URL indicators."),
    redFlags,
    greenFlags,
    recommendedAction: String(parsed.recommendedAction || DEFAULT_RECOMMENDED_ACTION)
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
  return {
    ...normalizeAiResponse(parseJsonFromModelOutput(raw)),
    providerUsed: `aipipe-openrouter:${env.aiPipeOpenRouterModel}`
  };
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
  return {
    ...normalizeAiResponse(parseJsonFromModelOutput(raw)),
    providerUsed: `openai:${env.openaiModel}`
  };
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
  return {
    ...normalizeAiResponse(parseJsonFromModelOutput(raw)),
    providerUsed: `ollama:${env.ollamaModel}`
  };
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

  for (let index = 0; index < sequence.length; index += 1) {
    const result = await sequence[index]();
    if (result) {
      return result;
    }
  }

  throw new Error(
    "AI analysis unavailable. Configure AIPIPE_TOKEN, OPENAI_API_KEY, or running OLLAMA server and retry."
  );
}

module.exports = { analyzeScamContent };
