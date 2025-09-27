const {
  createOrder,
  getOrderById,
  getOrdersByUserId,
  updateOrderStatus,
  addItemToOrder,
  deleteOrder,
} = require("../utils/orderUtils");

/**
 * Orders Controller - HTTP Request Handlers
 * 
 * This module handles HTTP requests for order management.
 * It uses the orderUtils for business logic and focuses on request/response handling.
 */

/**
 * Create a new order
 * POST /api/orders
 */
exports.createOrder = async (req, res) => {
  try {
    const { userId, items, transactionId, currency, notes } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required and cannot be empty' });
    }

    // Validate each item
    for (const item of items) {
      if (!item.product_name || !item.unit_price) {
        return res.status(400).json({ 
          error: 'Each item must have product_name and unit_price' 
        });
      }
    }

    const result = await createOrder(userId, items, transactionId, currency, notes);
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error in createOrder controller:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      details: error.message 
    });
  }
};

/**
 * Get order by ID
 * GET /api/orders/:id
 */
exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const result = await getOrderById(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in getOrder controller:', error);
    res.status(500).json({ 
      error: 'Failed to get order',
      details: error.message 
    });
  }
};

/**
 * Get orders by user ID
 * GET /api/orders/user/:userId
 */
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, offset, status } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const options = {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      status: status || null,
    };

    const result = await getOrdersByUserId(userId, options);
    
    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error('Error in getUserOrders controller:', error);
    res.status(500).json({ 
      error: 'Failed to get user orders',
      details: error.message 
    });
  }
};

/**
 * Update order status
 * PUT /api/orders/:id/status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const result = await updateOrderStatus(id, status);
    
    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error in updateOrderStatus controller:', error);
    if (error.message.includes('Invalid status') || error.message.includes('Order not found')) {
      return res.status(400).json({ 
        error: error.message 
      });
    }
    res.status(500).json({ 
      error: 'Failed to update order status',
      details: error.message 
    });
  }
};

/**
 * Add item to existing order
 * POST /api/orders/:id/items
 */
exports.addItemToOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const itemData = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    if (!itemData.product_name || !itemData.unit_price) {
      return res.status(400).json({ 
        error: 'Item must have product_name and unit_price' 
      });
    }

    const result = await addItemToOrder(id, itemData);
    
    res.status(201).json({
      success: true,
      message: 'Item added to order successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error in addItemToOrder controller:', error);
    if (error.message.includes('Order not found')) {
      return res.status(404).json({ 
        error: error.message 
      });
    }
    res.status(500).json({ 
      error: 'Failed to add item to order',
      details: error.message 
    });
  }
};

/**
 * Delete order (soft delete)
 * DELETE /api/orders/:id
 */
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const result = await deleteOrder(id);
    
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error in deleteOrder controller:', error);
    res.status(500).json({ 
      error: 'Failed to delete order',
      details: error.message 
    });
  }
};
