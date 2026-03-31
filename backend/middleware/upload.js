const multer = require("multer");
const path = require("path");
const ApiError = require("../utils/ApiError");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/x-pdf",
  "text/plain",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/json",
  "application/octet-stream",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".pdf", ".txt", ".csv", ".json", ".docx", ".md", ".tsv", ".log"]);

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname || "").toLowerCase();
  if (allowedMimeTypes.has(file.mimetype) || file.mimetype.startsWith("image/") || allowedExtensions.has(extension)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only image, PDF, TXT, CSV, JSON, and DOCX files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }
});

module.exports = upload;
