const express = require("express");
const Joi = require("joi");

const { createScan, getHistory, getCommunityScans } = require("../controllers/scanController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const upload = require("../middleware/upload");

const router = express.Router();

const scanSchema = Joi.object({
  inputType: Joi.string().valid("text", "url", "document").required(),
  contextType: Joi.string()
    .valid("general", "payment-request", "terms-conditions", "documents", "job-offer", "social-message", "email")
    .default("general"),
  content: Joi.string().allow(""),
  sourceUrl: Joi.string().allow("")
});

router.post("/analyze", protect, upload.single("file"), validate(scanSchema), createScan);
router.get("/history", protect, getHistory);
router.get("/community", protect, getCommunityScans);

module.exports = router;
