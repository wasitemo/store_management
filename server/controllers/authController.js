import jwt from "jsonwebtoken";
import bycrpt from "bcryptjs";
import env from "dotenv";
import { findUserByUsername, createAccount } from "../models/employeeModel.js";
import { saveRefreshToken, findRefreshToken, revokedToken } from "../models/refreshTokenModel.js";

env.config();

const generateAccessToken = (user) => { 
    return jwt.sign({ id: user.employee_account_id, username: user.username }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE,
    });
};

const generateRefreshToken = (user) => { 
    return jwt.sign({ id: user.employee_account_id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRE,
    });
};

export const register = async (req, res) => { 
    const employee_id = req.body.employee_id;
    const username = req.body.username;
    const role = req.body.role;
    const existing = await findUserByUsername(username);

    if (existing) return res.status(400).json({ message: "Username already registered" });

    const password = await bycrpt.hash(req.body.password, 10);

    await createAccount(employee_id, username, password, role);
    res.status(201).json({ message: "Account registered" });
};

export const login = async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const account = await findUserByUsername(username);

    if (!account) return res.status(401).json({ message: "Invalid credentials" });
    
    const match = await bycrpt.compare(password, account.password);

    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(account);
    const refreshToken = generateRefreshToken(account);

    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 30);
    await saveRefreshToken(account.id, refreshToken, expiresAt);

    res
        .cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 30 * 24 * 60 * 60 * 1000 })
        .json({ accessToken });
};
 
export const refresh = async (req, res) => { 
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) return res.statusStatus(401);

    const dbToken = await findRefreshToken(refreshToken);

    if (!dbToken) return res.sendStatus(403);

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, account) => {
        if (err) {
            return res.sendStatus(403);
        }

        const newAccessToken = generateAccessToken(account);

        res.json({ accessToken: newAccessToken });
    });
};

export const logout = async (req, res) => { 
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
        await revokedToken(refreshToken);
        
        res.clearCookie("refreshToken");
    }

    res.json({ message: "Logged out successfully" });
};