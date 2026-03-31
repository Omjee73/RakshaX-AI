const express = require("express");

const { getTrends } = require("../controllers/trendController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/summary", protect, getTrends);

module.exports = router;
