//server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const router = require("./routes/recipes");
const categoryRouter = require("./routes/categories");
const stripeRouter = require("./routes/stripe");
const { handleWebhook } = require("./controllers/stripeController");
const { connectDb } = require("./config/database");
//const { User, Recipe, Category } = require("./models/index");

const app = express();
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook,
);
app.use(express.urlencoded({ limit: "10mb", extended: false }));
app.use(express.json());

const corsOptions = {
  origin:
    process.env.FRONTEND_URL ||
    `http://localhost:${process.env.FRONTEND_PORT ? process.env.FRONTEND_PORT : 3000}`,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
connectDb();

app.use("/api/recipes", router);
app.use("/api/categories", categoryRouter);
app.use("/api/stripe", stripeRouter);

app.get("/", (req, res) => {
  res.json({
    success: true,
    msg: "Hello World!",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("App listening on port:", PORT);
});
