const { generateTrulyAgenticRecommendations } = require('../utils/trulyAgenticRecommendations');
const { executeAutomatedOrdering } = require('../utils/automatedOrdering');

// Main agentic controller that orchestrates the entire process
exports.agenticAnalysisAndOrdering = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    console.log(`Starting agentic analysis and ordering for user ${userId}`);

    // Step 1: Generate comprehensive recommendations using truly agentic system
    const recommendations = await generateTrulyAgenticRecommendations(userId);
    
    // Step 2: Prepare order-ready recommendations for frontend
    const orderReadyRecommendations = prepareOrderReadyRecommendations(recommendations.productRecommendations);
    
    // Step 3: Execute automated ordering for high-priority items
    let orderingResult = null;
    try {
      console.log(`Executing automated ordering for user ${userId}`);
      orderingResult = await executeAutomatedOrdering(userId, recommendations.productRecommendations);
      console.log("Automated ordering completed:", orderingResult);
    } catch (orderingError) {
      console.error("Error in automated ordering:", orderingError.message);
      // Continue with analysis even if ordering fails
      orderingResult = {
        success: false,
        error: orderingError.message,
        message: "Analysis completed but automated ordering failed"
      };
    }
    
    // Step 4: Prepare comprehensive response
    const response = {
      success: true,
      userId: userId,
      timestamp: new Date().toISOString(),
      analysis: {
        landAnalysis: recommendations.landAnalysis,
        cropRecommendations: recommendations.cropRecommendations,
        productRecommendations: recommendations.productRecommendations,
        aiInsights: recommendations.aiInsights
      },
      ordering: {
        automated: orderingResult,
        readyForFrontend: true,
        orderReadyRecommendations: orderReadyRecommendations,
        message: orderingResult?.success 
          ? "Analysis completed and automated orders placed successfully!" 
          : "Analysis completed. Some orders may have failed - check orderReadyRecommendations for manual ordering."
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error("Error in agentic analysis and ordering:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Prepare recommendations in format ready for frontend ordering
const prepareOrderReadyRecommendations = (productRecommendations) => {
  const orderReady = [];
  console.log(productRecommendations)
  // Filter for high and medium priority items that should be ordered
  const autoOrderItems = productRecommendations.filter(r => 
    r.priority === "high" || 
    (r.priority === "medium" && r.type === "tool")
  );
  
  autoOrderItems.forEach(item => {
    // Determine the correct merchant endpoint based on product type
    let endpoint = "";
    switch (item.type) {
      case "seed":
        endpoint = "/order/seeds";
        break;
      case "fertilizer":
        endpoint = "/order/fertilizers";
        break;
      case "tool":
        endpoint = "/order/tools";
        break;
      case "pesticide":
        endpoint = "/order/pesticides";
        break;
    }
    
    orderReady.push({
      endpoint: endpoint,
      merchantUrl: `${process.env.MERCHANT_URL || "http://localhost:4021"}${endpoint}`,
      product: item.product.name,
      quantity: item.quantity,
      priority: item.priority,
      reason: item.reason,
      estimatedCost: item.quantity * item.product.price,
      orderData: {
        product: item.product.name,
        quantity: item.quantity
      }
    });
  });
  
  return orderReady;
};

// Get recommendations only (without ordering)
exports.getAgenticRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    console.log(`Getting agentic recommendations for user ${userId}`);

    const recommendations = await generateTrulyAgenticRecommendations(userId);
    
    res.status(200).json({
      success: true,
      userId: userId,
      timestamp: new Date().toISOString(),
      recommendations: recommendations
    });

  } catch (error) {
    console.error("Error getting agentic recommendations:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Execute ordering for specific recommendations
exports.executeOrdering = async (req, res) => {
  try {
    const { userId, recommendations } = req.body;
    
    if (!userId || !recommendations) {
      return res.status(400).json({ error: "User ID and recommendations are required" });
    }

    console.log(`Executing ordering for user ${userId}`);

    const orderingResult = await executeAutomatedOrdering(userId, recommendations);
    
    res.status(200).json(orderingResult);

  } catch (error) {
    console.error("Error executing ordering:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Get order history for a user
exports.getOrderHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, offset, status } = req.query;

    if (!userId) {
      return res.status(400).json({ 
        success: false,
        error: 'User ID is required' 
      });
    }

    // Import the order utility function
    const { getOrdersByUserId } = require('../utils/orderUtils');

    const options = {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      status: status || null,
    };

    const orders = await getOrdersByUserId(userId, options);
    
    res.status(200).json({
      success: true,
      userId: userId,
      count: orders.length,
      orders: orders,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error getting order history:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
