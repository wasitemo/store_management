import express from "express";
import {
  presentStuffBrand,
  presentStuffBrandById,
  saveStuffBrand,
  changeStuffBrand,
} from "../controller/stuffBrandController.js";

const stuffBrandRoute = express.Router();

stuffBrandRoute.get("/stuff-brand", presentStuffBrand);
stuffBrandRoute.get("/stuff-brand/:stuff_brand_id", presentStuffBrandById);
stuffBrandRoute.post("/stuff-brand", saveStuffBrand);
stuffBrandRoute.put("/stuff-brand/:stuff_brand_id", changeStuffBrand);

export default stuffBrandRoute;
