import express from "express";
import {
  presentStuff,
  presentStuffById,
  presentImeiSn,
  presentValidImeiSn,
  presentStuffCBS,
  presentStuffHistory,
  saveStuff,
  changeStuff,
} from "../controller/stuffController.js";

const stuffRoute = express.Router();

stuffRoute.get("/stuff", presentStuff);
stuffRoute.get("/imei-sn", presentImeiSn);
stuffRoute.get("/stuff-scan", presentValidImeiSn);
stuffRoute.get("/stuff-cbs", presentStuffCBS);
stuffRoute.get("/stuff-history", presentStuffHistory);
stuffRoute.get("/stuff/:stuff_id", presentStuffById);
stuffRoute.post("/stuff", saveStuff);
stuffRoute.patch("/stuff/:stuff_id", changeStuff);

export default stuffRoute;
