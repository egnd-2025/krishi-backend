const { Orders, OrderItems } = require("../models");

const createOrdersTable = async () => {
  try {
    await Orders.sync({ force: false });
    console.log("Orders table created successfully");
  } catch (error) {
    console.error("Error creating orders table:", error);
  }
};

const createOrderItemsTable = async () => {
  try {
    await OrderItems.sync({ force: false });
    console.log("Order items table created successfully");
  } catch (error) {
    console.error("Error creating order items table:", error);
  }
};

const createOrderTables = async () => {
  console.log("Creating order-related tables...");
  await createOrdersTable();
  await createOrderItemsTable();
  console.log("All order tables created successfully");
  process.exit(0);
};

createOrderTables();
