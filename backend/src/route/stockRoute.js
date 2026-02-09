import express from "express";
import authentication from "../middleware/authMiddleware.js";
import uploadStockMiddleware from "../middleware/uploadStockMiddleware.js";
import {
  presentStock,
  presentStockHistory,
  presentStockSW,
  saveStock,
  downloadStockTemplateFile,
  uploadStock,
} from "../controller/stockController.js";

const stockRoute = express.Router();

stockRoute.get("/stock", authentication, presentStock);
stockRoute.get("/stock-history", authentication, presentStockHistory);
stockRoute.get("/stock-sw", authentication, presentStockSW);
stockRoute.get(
  "/download-stock-template",
  authentication,
  downloadStockTemplateFile,
);
stockRoute.post("/stock", authentication, saveStock);
stockRoute.post(
  "/upload-stock",
  authentication,
  uploadStockMiddleware.single("file"),
  uploadStock,
);

export default stockRoute;
