const { landsAdd, findLand } = require("../controllers/landsController");
const router = require("express").Router();

router.post("/add", landsAdd);
router.get("/:id", findLand);

module.exports = router;
