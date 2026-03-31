const fs = require("fs/promises");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function extractTextFromDocument(filePath, mimeType) {
  const extension = path.extname(filePath).toLowerCase();

  if (mimeType === "text/plain" || [".txt", ".md", ".csv", ".json"].includes(extension)) {
    const raw = await fs.readFile(filePath, "utf8");
    return normalizeText(raw).slice(0, 10000);
  }

  if (mimeType === "application/pdf" || extension === ".pdf") {
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
