const axios = require("axios");
const { wrapFetchWithPayment, decodeXPaymentResponse } = require("x402-fetch");
const { createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { polygonAmoy } = require('viem/chains');
const Orders = require('../models/orders');
const OrderItems = require('../models/orderItems');
require('dotenv').config();

// Initialize wallet client for X402 payments
const initializeWalletClient = () => {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.warn("PRIVATE_KEY not set in .env file - automated ordering will be skipped");
    return null;
  }

  const account = privateKeyToAccount(`0x${privateKey}`);
  const client = createWalletClient({
    account,
    chain: polygonAmoy,
    transport: http()
  });

  return { client, account };
};

// Save order to database
const saveOrderToDatabase = async (orderData, orderResult, userId) => {
  try {
    // Create the main order record
    const order = await Orders.create({
      user_id: userId,
      transaction_id: orderResult.paymentResponse?.transaction || null,
      status: orderResult.success ? 'completed' : 'failed',
      total_amount: orderResult.price || 0,
      currency: 'USD',
      notes: `Automated order: ${orderData.reason}`,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Create order item record
    await OrderItems.create({
      order_id: order.order_id,
      product_id: orderData.product.name,
      product_name: orderData.product.name,
      product_description: orderData.product.description || `${orderData.product.name} - ${orderData.type}`,
      quantity: orderData.quantity,
      unit_price: orderData.product.price,
      total_price: orderData.quantity * orderData.product.price,
      metadata: {
        type: orderData.type,
        priority: orderData.priority,
        reason: orderData.reason,
        paymentResponse: orderResult.paymentResponse,
        merchantOrderId: orderResult.orderId
      },
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log(`✅ Order saved to database: ${order.order_id}`);
    return order;
  } catch (error) {
    console.error("Error saving order to database:", error.message);
    throw error;
  }
};

// Place order using X402 payment system
const placeOrderWithX402 = async (orderData) => {
  try {
    const { client, account } = initializeWalletClient();
    const merchantUrl = process.env.MERCHANT_URL || "http://localhost:4021";
    console.log(orderData)
    console.log("Using wallet address:", account.address);
    
    const fetchWithPayment = wrapFetchWithPayment(fetch, client);
    
    // Determine the correct endpoint based on product type
    let endpoint = "";
    switch (orderData.type) {
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
      default:
        throw new Error(`Unknown product type: ${orderData.type}`);
    }

    const url = `${merchantUrl}${endpoint}`;
    
    console.log(`Placing order: ${orderData.product.name} (${orderData.quantity} ${orderData.product.unit})`);
    
    const response = await fetchWithPayment(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        product: orderData.product.name,
        quantity: orderData.quantity
      })
    });

    if (!response.ok) {
      throw new Error(`Order failed with status: ${response.status}`);
    }

    const orderResult = await response.json();
    
    // Decode payment response
    const paymentResponse = decodeXPaymentResponse(response.headers.get("x-payment-response"));
    
    return {
      success: true,
      orderId: orderResult.orderId,
      product: orderResult.product,
      quantity: orderResult.quantity,
      price: orderResult.price,
      paymentResponse,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error("Error placing order with X402:", error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Process multiple orders automatically with intelligent filtering
const processAutomatedOrders = async (recommendations, userId) => {
  const orderResults = [];
  
  // Intelligent ordering strategy: Order high and medium priority items automatically
  const autoOrderItems = recommendations.filter(r => 
    r.priority === "high" || 
    (r.priority === "medium" && r.type === "tool") // Essential tools
  );
  
  console.log(`Processing ${autoOrderItems.length} automatic orders for user ${userId}`);
  console.log(`Auto-ordering strategy: High priority items + Essential tools`);
  
  for (const recommendation of autoOrderItems) {
    try {
      console.log(`🤖 Auto-ordering: ${recommendation.product.name} (${recommendation.priority} priority)`);
      
      const orderResult = await placeOrderWithX402({
        type: recommendation.type,
        product: recommendation.product,
        quantity: recommendation.quantity,
        userId: userId,
        reason: recommendation.reason
      });
      
      // Save successful orders to database
      if (orderResult.success) {
        try {
          const savedOrder = await saveOrderToDatabase(recommendation, orderResult, userId);
          orderResult.databaseOrderId = savedOrder.order_id;
        } catch (dbError) {
          console.error(`❌ Failed to save order to database:`, dbError.message);
          // Continue with the order even if database save fails
        }
      }
      
      orderResults.push({
        recommendation,
        result: orderResult,
        automatic: true
      });
      
      // Add delay between orders to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to auto-order ${recommendation.product.name}:`, error.message);
      orderResults.push({
        recommendation,
        result: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        },
        automatic: true
      });
    }
  }
  
  // Log what was NOT ordered automatically
  const notAutoOrdered = recommendations.filter(r => 
    r.priority === "low" || 
    (r.priority === "medium" && r.type !== "tool")
  );
  
  if (notAutoOrdered.length > 0) {
    console.log(`📋 ${notAutoOrdered.length} items not auto-ordered (low priority or optional):`);
    notAutoOrdered.forEach(item => {
      console.log(`   • ${item.product.name} (${item.priority} priority, ${item.type})`);
    });
  }
  
  return orderResults;
};

// Generate order summary
const generateOrderSummary = async (orderResults) => {
  const successfulOrders = orderResults.filter(r => r.result.success);
  const failedOrders = orderResults.filter(r => !r.result.success);
  
  const totalCost = successfulOrders.reduce((sum, order) => {
    return sum + (order.result.price || 0);
  }, 0);
  
  const summary = {
    totalOrders: orderResults.length,
    successfulOrders: successfulOrders.length,
    failedOrders: failedOrders.length,
    totalCost: totalCost,
    orders: orderResults.map(order => ({
      product: order.recommendation.product.name,
      quantity: order.recommendation.quantity,
      unit: order.recommendation.product.unit,
      priority: order.recommendation.priority,
      success: order.result.success,
      orderId: order.result.orderId,
      databaseOrderId: order.result.databaseOrderId,
      price: order.result.price,
      transactionId: order.result.paymentResponse?.transaction,
      error: order.result.error
    })),
    timestamp: new Date().toISOString()
  };
  
  return summary;
};

// Main automated ordering function
const executeAutomatedOrdering = async (userId, recommendations) => {
  try {
    console.log(`Starting automated ordering for user ${userId}`);
    
    // Process high-priority orders automatically
    const orderResults = await processAutomatedOrders(recommendations, userId);
    
    // Generate summary
    const summary = await generateOrderSummary(orderResults);
    
    console.log("Automated ordering completed:", summary);
    
    return {
      success: true,
      summary,
      orderResults,
      message: `Successfully processed ${summary.successfulOrders}/${summary.totalOrders} orders`
    };
    
  } catch (error) {
    console.error("Error in automated ordering:", error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  placeOrderWithX402,
  processAutomatedOrders,
  generateOrderSummary,
  executeAutomatedOrdering,
  initializeWalletClient
};
