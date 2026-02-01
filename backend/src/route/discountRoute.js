import express from "express";
import authentication from "../middleware/authMiddleware.js";
import {
  presentStuffDiscount,
  presentStuffDiscountById,
  presentOrderDiscount,
  presentOrderDiscountById,
  presentDiscountStf,
  saveStuffDiscount,
  saveOrderDiscount,
  changeStuffDiscount,
} from "../controller/discountController.js";

const discountRoute = express.Router();

discountRoute.get("/stuff-discount", authentication, presentStuffDiscount);
discountRoute.get("/order-discount", authentication, presentOrderDiscount);
discountRoute.get("/stuff-discount-stf", authentication, presentDiscountStf);
discountRoute.get(
  "/stuff-discount/:stuff_id",
  authentication,
  presentStuffDiscountById,
);
discountRoute.get(
  "/order-discount/:discount_id",
  authentication,
  presentOrderDiscountById,
);
discountRoute.post("/stuff-discount", authentication, saveStuffDiscount);
discountRoute.post("/order-discount", authentication, saveOrderDiscount);
discountRoute.patch(
  "/stuff-discount/:discount_id",
  authentication,
  changeStuffDiscount,
);

export default discountRoute;
