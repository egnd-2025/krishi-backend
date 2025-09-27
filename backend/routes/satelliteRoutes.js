const { satelliteDataController } = require('../controllers/satelliteDataController');
const router = require("express").Router();

router.post("/get", satelliteDataController);

module.exports = router;