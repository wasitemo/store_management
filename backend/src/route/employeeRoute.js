import express from "express";
import {
  presentEmployee,
  presentEmployeeById,
  saveEmployee,
  changeEmployee,
} from "../controller/employeeController.js";

const employeeRoute = express.Router();

employeeRoute.get("/employee", presentEmployee);
employeeRoute.get("/employee/:employee_id", presentEmployeeById);
employeeRoute.post("/employee", saveEmployee);
employeeRoute.patch("/employee/:employee_id", changeEmployee);

export default employeeRoute;
