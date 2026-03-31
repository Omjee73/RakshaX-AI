const Tesseract = require("tesseract.js");

async function extractTextFromImage(imagePath) {
  const { data } = await Tesseract.recognize(imagePath, "eng");
  return data.text?.trim() || "";
}

module.exports = { extractTextFromImage };
