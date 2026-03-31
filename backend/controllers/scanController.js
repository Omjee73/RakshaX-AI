const fs = require("fs/promises");

const Scan = require("../models/Scan");
const Report = require("../models/Report");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { extractTextFromImage } = require("../services/ocrService");
const { extractTextFromDocument } = require("../services/documentService");
const { analyzeScamContent } = require("../services/aiService");
const { buildCacheKey, getCachedAnalysis, setCachedAnalysis } = require("../services/cacheService");
const { sendHighRiskAlert } = require("../services/emailService");
const { extractFirstUrl, fetchUrlContext } = require("../services/urlContentService");

const createScan = asyncHandler(async (req, res) => {
  const { inputType, contextType = "general", content = "", sourceUrl = "" } = req.body;

  let finalContent = content;
  let ocrText = "";
  let analyzedUrl = "";
  let analyzedUrlTitle = "";
  let analyzedUrlWarning = "";

  if (inputType === "image") {
    if (!req.file) {
      throw new ApiError(400, "Image file is required for image scan");
    }

    try {
      ocrText = await extractTextFromImage(req.file.path);
      finalContent = ocrText;
    } catch (error) {
      throw new ApiError(400, "OCR failed for the uploaded image. Please use a clearer image.");
    } finally {
      await fs.unlink(req.file.path).catch(() => null);
    }

    if (!finalContent || finalContent.trim().length < 8) {
      throw new ApiError(400, "OCR could not extract enough text. Upload a clearer image with readable text.");
    }
  }

  if (inputType === "document") {
    if (!req.file) {
      throw new ApiError(400, "Document file is required for document scan");
    }

    let docText = "";
    try {
      docText = await extractTextFromDocument(req.file.path, req.file.mimetype, req.file.originalname);
    } catch (error) {
      throw new ApiError(400, "Document parsing failed. Please upload a valid TXT, PDF, DOCX, CSV, or JSON file.");
    } finally {
      await fs.unlink(req.file.path).catch(() => null);
    }

    if (!docText || docText.length < 10) {
      throw new ApiError(
        400,
        "Could not extract enough text from the uploaded document. Please try TXT, PDF, or DOCX with readable text."
      );
    }

    finalContent = `[DOCUMENT:${req.file.originalname}]\n${docText}`;
  }

  if (inputType === "url") {
    analyzedUrl = sourceUrl || extractFirstUrl(content);
    if (analyzedUrl) {
      const urlContext = await fetchUrlContext(analyzedUrl);
      if (urlContext) {
        analyzedUrlTitle = urlContext.title || "";
        analyzedUrlWarning = urlContext.warning || "";
        if (urlContext.textSnippet) {
          finalContent = `${content}\n\n[URL TITLE]\n${urlContext.title || "Unknown"}\n\n[URL CONTENT SNIPPET]\n${urlContext.textSnippet}`;
        }
      }
    }
  }

  if (!finalContent || finalContent.length < 5) {
    throw new ApiError(400, "Submitted content is too short to analyze");
  }

  const cacheKey = buildCacheKey(`v5:${inputType}:${contextType}:${analyzedUrl || sourceUrl}:${finalContent}`);
  const cached = await getCachedAnalysis(cacheKey);
  const validCachedResult = cached && cached.providerUsed !== "heuristic-engine" ? cached : null;

  const aiResult =
    validCachedResult ||
    (await analyzeScamContent({
      inputType,
      contextType,
      content: finalContent,
      sourceUrl: analyzedUrl || sourceUrl,
      urlTitle: analyzedUrlTitle,
      urlWarning: analyzedUrlWarning
    }));
  if (!cached) {
    await setCachedAnalysis(cacheKey, aiResult, 3600);
  }

  const scan = await Scan.create({
    userId: req.user._id,
    inputType,
    contextType,
    content: finalContent,
    sourceUrl: sourceUrl || analyzedUrl,
    analyzedUrl,
    analyzedUrlTitle,
    analyzedUrlWarning,
    ocrText,
    scamScore: aiResult.scamScore,
    confidence: aiResult.confidence,
    verdict: aiResult.verdict,
    category: aiResult.category,
    explanation: aiResult.explanation,
    recommendedAction: aiResult.recommendedAction,
    redFlags: aiResult.redFlags || [],
    greenFlags: aiResult.greenFlags || [],
    providerUsed: aiResult.providerUsed || "ai-provider",
    analysisSummary: aiResult.analysisSummary || ""
  });

  await Report.create({ scanId: scan._id, tags: [aiResult.category] });

  if (scan.scamScore >= 80) {
    await sendHighRiskAlert({ to: req.user.email, scan }).catch(() => null);
  }

  res.status(201).json({ scan });
});

const getHistory = asyncHandler(async (req, res) => {
  const scans = await Scan.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100);
  res.status(200).json({ scans });
});

const getCommunityScans = asyncHandler(async (req, res) => {
  const scans = await Scan.find().sort({ createdAt: -1 }).limit(100);
  res.status(200).json({ scans });
});

module.exports = { createScan, getHistory, getCommunityScans };
