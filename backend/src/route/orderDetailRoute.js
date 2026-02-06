import express from "express";
import authentication from "../middleware/authMiddleware.js";
import { presentOrderDetail } from "../controller/orderDetailController.js";

const orderDetailRoute = express.Router();

orderDetailRoute.get(
  "/customer-order-detail/:order_id",
  authentication,
  presentOrderDetail,
);

export default orderDetailRoute;
