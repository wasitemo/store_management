import express from "express";
import authentication from "../middleware/authMiddleware.js";
import { presentStuffPurchaseDetailById } from "../controller/stuffPurchaseDetailController.js";

const stuffPurchaseDetailRoute = express.Router();

stuffPurchaseDetailRoute.get(
  "/stuff-purchase-detail/:stuff_purchase_id",
  authentication,
  presentStuffPurchaseDetailById,
);

export default stuffPurchaseDetailRoute;
