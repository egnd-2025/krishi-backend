const { gptRecommend } = require("../controllers/gptController");
const router = require("express").Router();

router.post("/recommend", gptRecommend);

module.exports = router;