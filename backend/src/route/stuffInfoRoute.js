import express from "express";
import authentication from "../middleware/authMiddleware.js";
import {
  presentImeiSn,
  presentValidImeiSn,
} from "../controller/stuffInfoController.js";

const stuffInfoRoute = express.Router();

stuffInfoRoute.get("/imei-sn", authentication, presentImeiSn);
stuffInfoRoute.get("/stuff-scan", authentication, presentValidImeiSn);

export default stuffInfoRoute;
