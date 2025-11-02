import express from "express";
import { register, login, refresh, logout } from "../controllers/authController.js";

const router = express.Router();

router.post("/register");
router.post("/login");
router.post("/refresh");
router.post("/logout");

export default router;