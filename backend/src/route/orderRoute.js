import express from "express";
import authentication from "../middleware/authMiddleware.js";
import {
  presentOrder,
  presentOrderPWSCO,
  saveOrder,
} from "../controller/orderController.js";

const orderRoute = express.Router();

orderRoute.get("/customer-order", authentication, presentOrder);
orderRoute.get("/customer-order-pwsco", authentication, presentOrderPWSCO);
orderRoute.post("/customer-order", authentication, saveOrder);

export default orderRoute;
