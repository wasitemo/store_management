import express from "express";
import authentication from "../middleware/authMiddleware.js";
import {
  presentImeiSn,
  presentValidImeiSn,
} from "../controller/imeiSnController.js";

const imeiSnRoute = express.Router();

imeiSnRoute.get("/imei-sn", authentication, presentImeiSn);
imeiSnRoute.get("/stuff-scan", authentication, presentValidImeiSn);

export default imeiSnRoute;
