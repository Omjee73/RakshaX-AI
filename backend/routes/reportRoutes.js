const express = require("express");
const Joi = require("joi");

const { voteReport, getReportByScanId } = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");

const router = express.Router();

const voteSchema = Joi.object({
  scanId: Joi.string().required(),
  voteType: Joi.string().valid("up", "down").required(),
  tags: Joi.array().items(Joi.string()).default([]),
  includeAccountEmail: Joi.boolean().default(true),
  additionalEmails: Joi.array().items(Joi.string().email()).max(5).default([])
});

router.post("/vote", protect, validate(voteSchema), voteReport);
router.get("/:scanId", protect, getReportByScanId);

module.exports = router;
