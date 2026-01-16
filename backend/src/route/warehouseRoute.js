import express from "express";
import {
  presentWarehouse,
  presentWarehouseById,
  saveWarehouse,
  changeWarehouse,
} from "../controller/warehouseController.js";

const warehouseRoute = express.Router();

warehouseRoute.get("/warehouse", presentWarehouse);
warehouseRoute.get("/warehouse/:warehouse_id", presentWarehouseById);
warehouseRoute.post("/warehouse", saveWarehouse);
warehouseRoute.patch("/warehouse/:warehouse_id", changeWarehouse);

export default warehouseRoute;
