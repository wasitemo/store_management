import express from "express";
import {
  presentSupplier,
  presentSupplierById,
  saveSupplier,
  changeSupplier,
} from "../controller/supplierController.js";

const supplierRoute = express.Router();

supplierRoute.get("/supplier", presentSupplier);
supplierRoute.get("/supplier/:supplier_id", presentSupplierById);
supplierRoute.post("/supplier", saveSupplier);
supplierRoute.patch("/supplier/:supplier_id", changeSupplier);

export default supplierRoute;
