import express from "express";
import authentication from "../middleware/authMiddleware.js";
import {
  presentStuff,
  presentStuffById,
  presentImeiSn,
  presentValidImeiSn,
  presentStuffCBS,
  saveStuff,
  changeStuff,
} from "../controller/stuffController.js";

const stuffRoute = express.Router();

stuffRoute.get("/stuff", authentication, presentStuff);
stuffRoute.get("/imei-sn", authentication, presentImeiSn);
stuffRoute.get("/stuff-scan", authentication, presentValidImeiSn);
stuffRoute.get("/stuff-cbs", authentication, presentStuffCBS);
stuffRoute.get("/stuff/:stuff_id", authentication, presentStuffById);
stuffRoute.post("/stuff", authentication, saveStuff);
stuffRoute.patch("/stuff/:stuff_id", authentication, changeStuff);

export default stuffRoute;
