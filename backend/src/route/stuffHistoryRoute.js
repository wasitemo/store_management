import express from "express";
import { presentStuffHistory } from "../controller/stuffHistoryController.js";

const stuffHistoryRoute = express.Router();

stuffHistoryRoute.get("/stuff-history", presentStuffHistory);

export default stuffHistoryRoute;
