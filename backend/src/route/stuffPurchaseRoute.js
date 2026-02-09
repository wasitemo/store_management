import express from "express";
import authentication from "../middleware/authMiddleware.js";
import uploadPurchaseMiddleware from "../middleware/uploadPurchaseMiddleware.js";
import {
  presentStuffPurchase,
  presentStuffPurchaseSWS,
  saveStuffPurchase,
  downloadPurchaseTemplateFile,
  uploadPurchase,
} from "../controller/stuffPurchaseController.js";

const stuffPurchaseRoute = express.Router();

stuffPurchaseRoute.get("/stuff-purchase", authentication, presentStuffPurchase);
stuffPurchaseRoute.get(
  "/stuff-purchase-sws",
  authentication,
  presentStuffPurchaseSWS,
);
stuffPurchaseRoute.get(
  "/download-purchase-template",
  authentication,
  downloadPurchaseTemplateFile,
);
stuffPurchaseRoute.post("/stuff-purchase", authentication, saveStuffPurchase);
stuffPurchaseRoute.post(
  "/upload-stuff-purchase",
  authentication,
  uploadPurchaseMiddleware.single("file"),
  uploadPurchase,
);

export default stuffPurchaseRoute;
