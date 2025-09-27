const { Users, Lands, Orders, OrderItems } = require("../models");

/**
 * Complete Database Setup Script
 * 
 * This script creates all necessary tables for the EGND-2025 application.
 * Run this after starting the Docker containers.
 */

const setupDatabase = async () => {
  try {
    console.log("Starting database setup...");
    
    // Create all tables
    console.log("Creating Users table...");
    await Users.sync({ force: false });
    console.log("Users table created");
    
    console.log("Creating Lands table...");
    await Lands.sync({ force: false });
    console.log("Lands table created");
    
    console.log("Creating Orders table...");
    await Orders.sync({ force: false });
    console.log("Orders table created");
    
    console.log("Creating Order Items table...");
    await OrderItems.sync({ force: false });
    console.log("Order Items table created");
    
    console.log(" Database setup completed successfully!");
    console.log("\nTables created:");
    console.log("  - users");
    console.log("  - lands");
    console.log("  - orders");
    console.log("  - order_items");
    
    process.exit(0);
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
};

setupDatabase();

