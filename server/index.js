import express from "express";
import env from "dotenv";
import cookieParser from "cookie-parser";
import authRoute from "./routes/authRoute.js";

env.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoute);

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});