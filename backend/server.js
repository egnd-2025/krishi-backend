const express = require("express");
const cors = require("cors");
require("dotenv").config();
const userRoutes = require("./routes/userRoutes");
const landRoutes = require("./routes/landRoutes");
const satelliteRoutes = require("./routes/satelliteRoutes");
const orderRoutes = require("./routes/orderRoutes");
const port = 5000;

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/user", userRoutes);
app.use("/api/land", landRoutes);
app.use("/api/satellite", satelliteRoutes);
app.use("/api/orders", orderRoutes);

app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`);
});
