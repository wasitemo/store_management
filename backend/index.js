import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import errorHandler from "./src/middleware/errorHandler.js";
import authRoute from "./src/route/authRoute.js";
import employeeRoute from "./src/route/employeeRoute.js";
import warehouseRoute from "./src/route/warehouseRoute.js";
import supplierRoute from "./src/route/supplierRoute.js";
import stuffCategoryRoute from "./src/route/stuffCategoryRoute.js";
import stuffBrandRoute from "./src/route/stuffBrandRoute.js";
import stuffRoute from "./src/route/stuffRoute.js";
import stuffHistoryRoute from "./src/route/stuffHistoryRoute.js";
import imeiSnRoute from "./src/route/imeiSnRoute.js";
import stuffPurchaseRoute from "./src/route/stuffPurchaseRoute.js";
import stuffPurchaseDetailRoute from "./src/route/stuffPurchaseDetailRoute.js";
import customerRoute from "./src/route/customerRoute.js";
import paymentMethodRoute from "./src/route/paymentMethodRoute.js";
import discountRoute from "./src/route/discountRoute.js";
import stockRoute from "./src/route/stockRoute.js";
import orderRoute from "./src/route/orderRoute.js";

const app = express();
const BACKEND_PORT = process.env.BACKEND_PORT;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3001");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use("/", authRoute);
app.use("/", employeeRoute);
app.use("/", warehouseRoute);
app.use("/", supplierRoute);
app.use("/", stuffCategoryRoute);
app.use("/", stuffBrandRoute);
app.use("/", stuffRoute);
app.use("/", stuffHistoryRoute);
app.use("/", imeiSnRoute);
app.use("/", stuffPurchaseRoute);
app.use("/", stuffPurchaseDetailRoute);
app.use("/", customerRoute);
app.use("/", paymentMethodRoute);
app.use("/", discountRoute);
app.use("/", stockRoute);
app.use("/", orderRoute);

app.use(errorHandler);
app.listen(BACKEND_PORT, () => {
  console.log(`Server running on port ${BACKEND_PORT}`);
});
