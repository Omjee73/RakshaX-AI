const fs = require("fs/promises");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
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
    const parsed = await pdfParse(buffer);
    return normalizeText(parsed.text).slice(0, 10000);
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) {
    const result = await mammoth.extractRawText({ path: filePath });
    return normalizeText(result.value).slice(0, 10000);
  }

  return "";
}

module.exports = { extractTextFromDocument };
