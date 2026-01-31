import express from "express";
import authentication from "../middleware/authMiddleware.js";
import {
  presentCustomer,
  presentCustomerById,
  saveCustomer,
  changeCustomer,
} from "../controller/customerController.js";

const customerRoute = express.Router();

customerRoute.get("/customer", authentication, presentCustomer);
customerRoute.get(
  "/customer/:customer_id",
  authentication,
  presentCustomerById,
);
customerRoute.post("/customer", authentication, saveCustomer);
customerRoute.patch("/customer/:customer_id", authentication, changeCustomer);

export default customerRoute;
