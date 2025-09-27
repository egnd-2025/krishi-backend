import express from "express";
import { paymentMiddleware } from "x402-express";

const app = express();

app.use(express.json());

app.use(paymentMiddleware(
  "0xCA3953e536bDA86D1F152eEfA8aC7b0C82b6eC00", // receiving wallet address
  {  // Route configurations for protected endpoints
    "POST /order/seed/": {
      price: "$0.004",
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
      price: "$0.001",
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
      price: "$0.002",
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
      price: "$0.003",
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
  const price = quantity * 2.00;
  
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
  const price = quantity * 1.50;
  
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
  const price = quantity * 5.00;
  
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
  const price = quantity * 3.00;
  
  res.send({
    orderId,
    product,
    quantity,
    price,
  });
});

app.listen(4021, () => {
  console.log(`Server listening at http://localhost:4021`);
}); 