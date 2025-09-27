const { Orders, OrderItems } = require("../models");
const { Op } = require("sequelize");

const createOrder = async (userId, items, transactionId = null, currency = 'USD', notes = null) => {
  try {
    // Calculate total amount
    const totalAmount = calculateOrderTotal(items);
    
    // Create the order
    const order = await Orders.create({
      user_id: userId,
      transaction_id: transactionId,
      status: 'pending',
      total_amount: totalAmount,
      currency: currency,
      notes: notes,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Add items to the order
    const orderItems = [];
    for (const item of items) {
      const orderItem = await OrderItems.create({
        order_id: order.order_id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        product_description: item.product_description || null,
        quantity: item.quantity || 1,
        unit_price: item.unit_price,
        total_price: (item.quantity || 1) * item.unit_price,
        metadata: item.metadata || null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      orderItems.push(orderItem);
    }

    return {
      order: order,
      items: orderItems,
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

const getOrderById = async (orderId) => {
  try {
    const order = await Orders.findByPk(orderId);
    if (!order) {
      return null;
    }

    const items = await OrderItems.findAll({
      where: { order_id: orderId },
      order: [['created_at', 'ASC']],
    });

    return {
      order: order,
      items: items,
    };
  } catch (error) {
    console.error('Error getting order by ID:', error);
    throw error;
  }
};

const getOrdersByUserId = async (userId, options = {}) => {
  try {
    const { limit = 50, offset = 0, status = null } = options;
    
    const whereClause = { user_id: userId };
    if (status) {
      whereClause.status = status;
    }

    const orders = await Orders.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: limit,
      offset: offset,
    });

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItems.findAll({
          where: { order_id: order.order_id },
          order: [['created_at', 'ASC']],
        });
        return {
          order: order,
          items: items,
        };
      })
    );

    return ordersWithItems;
  } catch (error) {
    console.error('Error getting orders by user ID:', error);
    throw error;
  }
};

const updateOrderStatus = async (orderId, status) => {
  try {
    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    const [updatedRowsCount] = await Orders.update(
      { 
        status: status,
        updated_at: new Date(),
      },
      { 
        where: { order_id: orderId } 
      }
    );

    if (updatedRowsCount === 0) {
      throw new Error('Order not found');
    }

    return await Orders.findByPk(orderId);
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

const addItemToOrder = async (orderId, itemData) => {
  try {
    // Verify order exists
    const order = await Orders.findByPk(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Create the item
    const orderItem = await OrderItems.create({
      order_id: orderId,
      product_id: itemData.product_id || null,
      product_name: itemData.product_name,
      product_description: itemData.product_description || null,
      quantity: itemData.quantity || 1,
      unit_price: itemData.unit_price,
      total_price: (itemData.quantity || 1) * itemData.unit_price,
      metadata: itemData.metadata || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Update order total
    await updateOrderTotal(orderId);

    return orderItem;
  } catch (error) {
    console.error('Error adding item to order:', error);
    throw error;
  }
};

const calculateOrderTotal = (items) => {
  return items.reduce((total, item) => {
    const quantity = item.quantity || 1;
    const unitPrice = item.unit_price || 0;
    return total + (quantity * unitPrice);
  }, 0);
};

const updateOrderTotal = async (orderId) => {
  try {
    const items = await OrderItems.findAll({
      where: { order_id: orderId },
    });

    const totalAmount = items.reduce((total, item) => {
      return total + parseFloat(item.total_price);
    }, 0);

    const [updatedRowsCount] = await Orders.update(
      { 
        total_amount: totalAmount,
        updated_at: new Date(),
      },
      { 
        where: { order_id: orderId } 
      }
    );

    if (updatedRowsCount === 0) {
      throw new Error('Order not found');
    }

    return await Orders.findByPk(orderId);
  } catch (error) {
    console.error('Error updating order total:', error);
    throw error;
  }
};

const deleteOrder = async (orderId) => {
  try {
    return await updateOrderStatus(orderId, 'cancelled');
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getOrdersByUserId,
  updateOrderStatus,
  addItemToOrder,
  calculateOrderTotal,
  updateOrderTotal,
  deleteOrder,
};
