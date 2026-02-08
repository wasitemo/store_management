import express from "express";
import authentication from "../middleware/authMiddleware.js";
import {
  presentPaymentMethod,
  presentPaymentMethodById,
  savePaymentMethod,
  changePaymentMethod,
} from "../controller/paymentMethodController.js";

const paymentMethodRoute = express.Router();

paymentMethodRoute.get("/payment-method", authentication, presentPaymentMethod);
paymentMethodRoute.get(
  "/payment-method/:payment_method_id",
  authentication,
  presentPaymentMethodById,
);
paymentMethodRoute.post("/payment-method", authentication, savePaymentMethod);
paymentMethodRoute.put(
  "/payment-method/:payment_method_id",
  authentication,
  changePaymentMethod,
);

export default paymentMethodRoute;
