const fs = require("fs/promises");
const { createWorker } = require("tesseract.js");
const { Jimp } = require("jimp");

async function extractTextFromImage(imagePath) {
  let worker;
  let normalizedPath;

  try {
    // Validate image bytes and generate a normalized OCR-friendly PNG first.
    const image = await Jimp.read(imagePath);
    image.greyscale().contrast(0.15);
    normalizedPath = `${imagePath}.ocr.png`;
    await image.write(normalizedPath);

    worker = await createWorker("eng");
    const { data } = await worker.recognize(normalizedPath);
    return data?.text?.trim() || "";
  } catch (error) {
    throw new Error("OCR processing failed");
  } finally {
    if (worker) {
      await worker.terminate().catch(() => null);
    }

    if (normalizedPath) {
      await fs.unlink(normalizedPath).catch(() => null);
    }
  }
}

module.exports = { extractTextFromImage };
