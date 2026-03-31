const axios = require("axios");
const cheerio = require("cheerio");
const dns = require("dns").promises;
const net = require("net");

const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
const PRIVATE_IP_RANGES = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./
];

function extractFirstUrl(text = "") {
  const match = text.match(/(https?:\/\/[^\s]+)|(www\.[^\s]+)/i);
  if (!match) return "";
  return match[0].startsWith("http") ? match[0] : `https://${match[0]}`;
}

async function isBlockedHost(hostname) {
  const host = (hostname || "").toLowerCase();
  if (BLOCKED_HOSTS.has(host)) return true;

  if (net.isIP(host)) {
    return PRIVATE_IP_RANGES.some((pattern) => pattern.test(host));
  }

  try {
    const records = await dns.lookup(host, { all: true });
    return records.some((record) => PRIVATE_IP_RANGES.some((pattern) => pattern.test(record.address)));
  } catch (error) {
    return false;
  }
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function fetchUrlContext(rawUrl) {
  if (!rawUrl) return null;

  const candidate = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
  let parsed;

  try {
    parsed = new URL(candidate);
  } catch (error) {
    return null;
  }

  const blocked = await isBlockedHost(parsed.hostname);
  if (blocked) {
    return {
      url: candidate,
      title: "",
      textSnippet: "",
      warning: "Blocked local/private network URL for security reasons"
    };
  }

  try {
    const response = await axios.get(candidate, {
      timeout: 10000,
      maxRedirects: 3,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
      }
    });

    const html = String(response.data || "");
    const $ = cheerio.load(html);
    const title = normalizeText($("title").first().text());
    const bodyText = normalizeText($("body").text());
    const textSnippet = bodyText.slice(0, 2200);

    return {
      url: candidate,
      finalUrl: response.request?.res?.responseUrl || candidate,
      title,
      textSnippet,
      warning: ""
    };
  } catch (error) {
    try {
      const readerResponse = await axios.get(`https://r.jina.ai/http://${parsed.host}${parsed.pathname}${parsed.search}`, {
        timeout: 12000,
        headers: {
          "User-Agent": "RakshaXAI-URL-Analyzer/1.0"
        }
      });

      const textSnippet = normalizeText(readerResponse.data || "").slice(0, 2200);
      return {
        url: candidate,
        finalUrl: candidate,
        title: "",
        textSnippet,
        warning: "Fetched via fallback reader because direct fetch was blocked"
      };
    } catch (fallbackError) {
      // fall through to warning response when both direct and fallback fetch fail
    }

    return {
      url: candidate,
      title: "",
      textSnippet: "",
      warning: `Failed to fetch URL content: ${error.message}`
    };
  }
}

module.exports = { extractFirstUrl, fetchUrlContext };
