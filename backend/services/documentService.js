const fs = require("fs/promises");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function extractPrintableTextFromBinary(buffer) {
  const raw = buffer.toString("latin1");
  const chunks = raw.match(/[\x20-\x7E]{4,}/g) || [];
  return normalizeText(chunks.join(" "));
}

function isTextLike(mimeType, extension) {
  return (
    String(mimeType || "").startsWith("text/") ||
    [
      ".txt",
      ".md",
      ".csv",
      ".tsv",
      ".json",
      ".log"
    ].includes(extension)
  );
}

async function readTextWithFallback(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    const latin = await fs.readFile(filePath, "latin1");
    return latin;
  }
}

async function extractTextFromDocument(filePath, mimeType, originalName = "") {
  const extension = path.extname(originalName || filePath).toLowerCase();

  if (isTextLike(mimeType, extension)) {
    const raw = await readTextWithFallback(filePath);
    return normalizeText(raw).slice(0, 10000);
  }

  if (
    mimeType === "application/pdf" ||
    mimeType === "application/x-pdf" ||
    extension === ".pdf"
  ) {
    const buffer = await fs.readFile(filePath);
    try {
      const parsed = await pdfParse(buffer);
      const pdfText = normalizeText(parsed.text);
      if (pdfText.length >= 10) {
        return pdfText.slice(0, 10000);
      }
    } catch (error) {
      // Fall through to binary text extraction.
    }

    const fallbackText = extractPrintableTextFromBinary(buffer);
    if (fallbackText.length >= 10) {
      return fallbackText.slice(0, 10000);
    }

    return "";
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const docxText = normalizeText(result.value);
      if (docxText.length >= 10) {
        return docxText.slice(0, 10000);
      }
    } catch (error) {
      // Fall back to generic text read for mis-labeled files.
    }

    const fallbackRaw = await readTextWithFallback(filePath);
    return normalizeText(fallbackRaw).slice(0, 10000);
  }

  const fallbackRaw = await readTextWithFallback(filePath);
  return normalizeText(fallbackRaw).slice(0, 10000);
}

module.exports = { extractTextFromDocument };
