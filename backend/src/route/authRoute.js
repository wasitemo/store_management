import express from "express";
import authentication from "../middleware/authMiddleware.js";
import {
  presentAccount,
  presentAccountById,
  presentEmployeeName,
  registerAccount,
  loginAccount,
  refreshToken,
  changeAccount,
  logoutAccount,
} from "../controller/authController.js";

const authRoute = express.Router();

authRoute.get("/employee-account", authentication, presentAccount);
authRoute.get("/employee-account-le", authentication, presentEmployeeName);
authRoute.get(
  "/employee-account/:employee_account_id",
  authentication,
  presentAccountById,
);
authRoute.post("/register", registerAccount);
authRoute.post("/login", loginAccount);
authRoute.post("/refresh-token", refreshToken);
authRoute.patch(
  "/employee-account/:employee_account_id",
  authentication,
  changeAccount,
);
authRoute.post("/logout", logoutAccount);

export default authRoute;
