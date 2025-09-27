const { 
  createOrder, 
  getOrder, 
  getUserOrders, 
  updateOrderStatus, 
  addItemToOrder, 
  deleteOrder 
} = require("../controllers/ordersController");
const router = require("express").Router();

// Order routes
router.post("/", createOrder);                    // POST /api/orders
router.get("/:id", getOrder);                     // GET /api/orders/:id
router.get("/user/:userId", getUserOrders);      // GET /api/orders/user/:userId
router.put("/:id/status", updateOrderStatus);    // PUT /api/orders/:id/status
router.post("/:id/items", addItemToOrder);       // POST /api/orders/:id/items
router.delete("/:id", deleteOrder);               // DELETE /api/orders/:id

module.exports = router;
