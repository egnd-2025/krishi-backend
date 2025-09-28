import express from "express";
import { paymentMiddleware } from "x402-express";

const app = express();

app.use(express.json());

app.use(paymentMiddleware(
  "0xCA3953e536bDA86D1F152eEfA8aC7b0C82b6eC00", // receiving wallet address
  {  // Route configurations for protected endpoints
    "POST /order/seeds": {
      price: "$0.04",
      network: "polygon-amoy",
      config: {
        description: "Order seeds",
        inputSchema: {
          type: "object",
          properties: {
            product: { type: "string", description: "Product name (Basmati Rice Seeds, Wheat Seeds, Cotton Seeds)" },
            quantity: { type: "number", description: "Quantity in kg" }
          }
        }
      }
    },
    "POST /order/fertilizers": {
      price: "$0.01",
      network: "polygon-amoy",
      config: {
        description: "Order fertilizers",
        inputSchema: {
          type: "object",
          properties: {
            product: { type: "string", description: "Product name (Urea, DAP, NPK 19-19-19)" },
            quantity: { type: "number", description: "Quantity in kg" }
          }
        }
      }
    },
    "POST /order/tools": {
      price: "$0.02",
      network: "polygon-amoy",
      config: {
        description: "Order farming tools",
        inputSchema: {
          type: "object",
          properties: {
            product: { type: "string", description: "Product name (Steel Plow, Hand Sickle, Water Sprayer)" },
            quantity: { type: "number", description: "Quantity" }
          }
        }
      }
    },
    "POST /order/pesticides": {
      price: "$0.03",
      network: "polygon-amoy",
      config: {
        description: "Order pesticides",
        inputSchema: {
          type: "object",
          properties: {
            product: { type: "string", description: "Product name (Glyphosate, Neem Oil, Deltamethrin)" },
            quantity: { type: "number", description: "Quantity in liters" }
          }
        }
      }
    },
  },
  {
    url: process.env.FACILITATOR_URL || "https://x402.polygon.technology", // Polygon Amoy facilitator
  }
));

// Implement your routes
app.post("/order/seeds", (req, res) => {
  const { product, quantity } = req.body;
  const orderId = `SEED-${Date.now()}`;
  
  // Get price from product catalog
  const seeds = [
    { name: "Basmati Rice Seeds", price: 120.00 },
    { name: "Wheat Seeds", price: 80.00 },
    { name: "Cotton Seeds", price: 95.00 },
    { name: "Maize Seeds", price: 85.00 },
    { name: "Soybean Seeds", price: 70.00 }
  ];
  
  const selectedSeed = seeds.find(s => s.name === product);
  const unitPrice = selectedSeed ? selectedSeed.price : 100.00; // fallback price
  const price = quantity * unitPrice;
  
  res.send({
    orderId,
    product,
    quantity,
    price,
  });
});

app.post("/order/fertilizers", (req, res) => {
  const { product, quantity } = req.body;
  const orderId = `FERT-${Date.now()}`;
  
  // Get price from product catalog
  const fertilizers = [
    { name: "Urea", price: 5.36 },
    { name: "DAP", price: 27.00 },
    { name: "NPK 19-19-19", price: 48.00 },
    { name: "Potash", price: 34.00 },
    { name: "Compost", price: 6.00 }
  ];
  
  const selectedFertilizer = fertilizers.find(f => f.name === product);
  const unitPrice = selectedFertilizer ? selectedFertilizer.price : 20.00; // fallback price
  const price = quantity * unitPrice;
  
  res.send({
    orderId,
    product,
    quantity,
    price,
  });
});

app.post("/order/tools", (req, res) => {
  const { product, quantity } = req.body;
  const orderId = `TOOL-${Date.now()}`;
  
  // Get price from product catalog
  const tools = [
    { name: "Steel Plow", price: 4500.00 },
    { name: "Hand Sickle", price: 150.00 },
    { name: "Water Sprayer", price: 1800.00 },
    { name: "Seed Drill", price: 9000.00 },
    { name: "Hoe", price: 350.00 }
  ];
  
  const selectedTool = tools.find(t => t.name === product);
  const unitPrice = selectedTool ? selectedTool.price : 1000.00; // fallback price
  const price = quantity * unitPrice;
  
  res.send({
    orderId,
    product,
    quantity,
    price,
  });
});

app.post("/order/pesticides", (req, res) => {
  const { product, quantity } = req.body;
  const orderId = `PEST-${Date.now()}`;
  
  // Get price from product catalog
  const pesticides = [
    { name: "Glyphosate", price: 450.00 },
    { name: "Neem Oil", price: 550.00 },
    { name: "Deltamethrin", price: 380.00 },
    { name: "Copper Sulfate", price: 300.00 },
    { name: "Bacillus Thuringiensis", price: 650.00 }
  ];
  
  const selectedPesticide = pesticides.find(p => p.name === product);
  const unitPrice = selectedPesticide ? selectedPesticide.price : 400.00; // fallback price
  const price = quantity * unitPrice;
  
  res.send({
    orderId,
    product,
    quantity,
    price,
  });
});

// Product catalog endpoints (no payment required)
app.get("/products/seeds", (req, res) => {
  const seeds = [
    { name: "Basmati Rice Seeds", price: 120.00, unit: "kg", description: "Premium basmati rice seeds for high yield", category: "cereal" },
    { name: "Wheat Seeds", price: 80.00, unit: "kg", description: "High-quality wheat seeds for bread production", category: "cereal" },
    { name: "Cotton Seeds", price: 95.00, unit: "kg", description: "Premium cotton seeds for textile production", category: "fiber" },
    { name: "Maize Seeds", price: 85.00, unit: "kg", description: "Hybrid maize seeds for high productivity", category: "cereal" },
    { name: "Soybean Seeds", price: 70.00, unit: "kg", description: "Protein-rich soybean seeds", category: "legume" }
  ]
  res.json(seeds);
});

app.get("/products/fertilizers", (req, res) => {
  const fertilizers =[
    { name: "Urea", price: 5.36, unit: "kg", description: "Nitrogen-rich fertilizer for plant growth", npk: "46-0-0" },
    { name: "DAP", price: 27.00, unit: "kg", description: "Diammonium phosphate for root development", npk: "18-46-0" },
    { name: "NPK 19-19-19", price: 48.00, unit: "kg", description: "Balanced NPK fertilizer for overall plant health", npk: "19-19-19" },
    { name: "Potash", price: 34.00, unit: "kg", description: "Potassium fertilizer for fruit development", npk: "0-0-60" },
    { name: "Compost", price: 6.00, unit: "kg", description: "Organic compost for soil improvement", npk: "2-1-1" }
  ]
  res.json(fertilizers);
});

app.get("/products/tools", (req, res) => {
  const tools = [
    { name: "Steel Plow", price: 4500.00, unit: "piece", description: "Heavy-duty steel plow for soil preparation", category: "tillage" },
    { name: "Hand Sickle", price: 150.00, unit: "piece", description: "Traditional hand sickle for harvesting", category: "harvesting" },
    { name: "Water Sprayer", price: 1800.00, unit: "piece", description: "Manual water sprayer for irrigation", category: "irrigation" },
    { name: "Seed Drill", price: 9000.00, unit: "piece", description: "Precision seed drill for planting", category: "planting" },
    { name: "Hoe", price: 350.00, unit: "piece", description: "Multi-purpose hoe for weeding and cultivation", category: "cultivation" }
  ];
  res.json(tools);
});

app.get("/products/pesticides", (req, res) => {
  const pesticides = [
    { name: "Glyphosate", price: 450.00, unit: "liter", description: "Broad-spectrum herbicide for weed control", type: "herbicide" },
    { name: "Neem Oil", price: 550.00, unit: "liter", description: "Organic pesticide from neem tree", type: "organic" },
    { name: "Deltamethrin", price: 380.00, unit: "liter", description: "Synthetic insecticide for pest control", type: "insecticide" },
    { name: "Copper Sulfate", price: 300.00, unit: "liter", description: "Fungicide for disease prevention", type: "fungicide" },
    { name: "Bacillus Thuringiensis", price: 650.00, unit: "liter", description: "Biological insecticide", type: "biological" }
  ];
  res.json(pesticides);
});

app.get("/products/all", (req, res) => {
  const allProducts = {
    seeds: [
      { name: "Basmati Rice Seeds", price: 120.00, unit: "kg", description: "Premium basmati rice seeds for high yield", category: "cereal" },
      { name: "Wheat Seeds", price: 80.00, unit: "kg", description: "High-quality wheat seeds for bread production", category: "cereal" },
      { name: "Cotton Seeds", price: 95.00, unit: "kg", description: "Premium cotton seeds for textile production", category: "fiber" },
      { name: "Maize Seeds", price: 85.00, unit: "kg", description: "Hybrid maize seeds for high productivity", category: "cereal" },
      { name: "Soybean Seeds", price: 70.00, unit: "kg", description: "Protein-rich soybean seeds", category: "legume" }
    ],
    fertilizers: [
      { name: "Urea", price: 5.36, unit: "kg", description: "Nitrogen-rich fertilizer for plant growth", npk: "46-0-0" },
      { name: "DAP", price: 27.00, unit: "kg", description: "Diammonium phosphate for root development", npk: "18-46-0" },
      { name: "NPK 19-19-19", price: 48.00, unit: "kg", description: "Balanced NPK fertilizer for overall plant health", npk: "19-19-19" },
      { name: "Potash", price: 34.00, unit: "kg", description: "Potassium fertilizer for fruit development", npk: "0-0-60" },
      { name: "Compost", price: 6.00, unit: "kg", description: "Organic compost for soil improvement", npk: "2-1-1" }
    ],
    tools: [
      { name: "Steel Plow", price: 4500.00, unit: "piece", description: "Heavy-duty steel plow for soil preparation", category: "tillage" },
      { name: "Hand Sickle", price: 150.00, unit: "piece", description: "Traditional hand sickle for harvesting", category: "harvesting" },
      { name: "Water Sprayer", price: 1800.00, unit: "piece", description: "Manual water sprayer for irrigation", category: "irrigation" },
      { name: "Seed Drill", price: 9000.00, unit: "piece", description: "Precision seed drill for planting", category: "planting" },
      { name: "Hoe", price: 350.00, unit: "piece", description: "Multi-purpose hoe for weeding and cultivation", category: "cultivation" }
    ],
    pesticides: [
      { name: "Glyphosate", price: 450.00, unit: "liter", description: "Broad-spectrum herbicide for weed control", type: "herbicide" },
      { name: "Neem Oil", price: 550.00, unit: "liter", description: "Organic pesticide from neem tree", type: "organic" },
      { name: "Deltamethrin", price: 380.00, unit: "liter", description: "Synthetic insecticide for pest control", type: "insecticide" },
      { name: "Copper Sulfate", price: 300.00, unit: "liter", description: "Fungicide for disease prevention", type: "fungicide" },
      { name: "Bacillus Thuringiensis", price: 650.00, unit: "liter", description: "Biological insecticide", type: "biological" }
    ]
  };
  res.json(allProducts);
});

app.listen(4021, () => {
  console.log(`Server listening at http://localhost:4021`);
}); 