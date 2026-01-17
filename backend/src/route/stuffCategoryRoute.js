import express from "express";
import {
  presentStuffCategory,
  presentStuffCategoryById,
  saveStuffCategory,
  changeStuffCategory,
} from "../controller/stuffCategoryController.js";

const stuffCategoryRoute = express.Router();

stuffCategoryRoute.get("/stuff-category", presentStuffCategory);
stuffCategoryRoute.get(
  "/stuff-category/:stuff_category_id",
  presentStuffCategoryById
);
stuffCategoryRoute.post("/stuff-category", saveStuffCategory);
stuffCategoryRoute.put(
  "/stuff-category/:stuff_category_id",
  changeStuffCategory
);

export default stuffCategoryRoute;
