const { 
  agenticAnalysisAndOrdering, 
  getAgenticRecommendations, 
  executeOrdering, 
  getOrderHistory 
} = require('../controllers/agenticController');
const router = require("express").Router();

// Main agentic endpoint - analyzes land/soil and optionally places orders
router.post("/analyze-and-order", agenticAnalysisAndOrdering);

// Get recommendations only (without ordering)
router.get("/recommendations/:userId", getAgenticRecommendations);

// Execute ordering for specific recommendations
router.post("/execute-ordering", executeOrdering);

// Get order history for a user
router.get("/order-history/:userId", getOrderHistory);

module.exports = router;
