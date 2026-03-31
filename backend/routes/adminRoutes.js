const express = require("express");
const Joi = require("joi");

const { getAdminOverview, updateFlagStatus } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const validate = require("../middleware/validate");

const router = express.Router();

const flagSchema = Joi.object({
  scanId: Joi.string().required(),
  flagged: Joi.boolean().required()
});

router.get("/overview", protect, authorize("admin"), getAdminOverview);
router.patch("/flag", protect, authorize("admin"), validate(flagSchema), updateFlagStatus);

module.exports = router;
