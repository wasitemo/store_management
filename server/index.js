import express from "express";
import env from "dotenv";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import pg from "pg";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";

env.config();
const app = express();
const saltRounds = 12;
const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
});
db.connect();

app.use(
    session({
        secret: process.env.ACCESS_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

app.get("/employee", async (req, res) => {
    try {
        const query = await db.query("SELECT * FROM employee");
        const result = query.rows;

        res.json(result);
    } catch (err) {
        console.error(err);
    }
});

app.post("/create-account", async (req, res) => {
    const employeeId = req.body.employeeId;
    const username = req.body.username;
    const password = req.body.password;
    const role = req.body.role;

    if (!employeeId || !username || !password || !role) {
        return res.status(400).json({ status: "Error", message: "Missing required key: employeeId, username, password, role" });
    }

    try {
        const checkResult = await db.query("SELECT * FROM employee_account WHERE username = $1", [username]);

        if (checkResult.rows.length > 0) {
            res.status(404).json({status: "Error", message: "Username already used"});
        }
        else
        {
            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if (err)
                {
                    console.error("Error hashing password : ",err);
                }
                else
                {
                    const query = await db.query("INSERT INTO employee_account (employee_id, username, password, role) VALUES ($1, $2, $3, $4)", [employeeId, username, hash, role]);
                    const account = await query.rows[0];

                    req.login(account, (err) => {
                        res.status(200).json({status: "OK" , message: "Create account success", data: [{employeeId: employeeId, username: username, password: password, role: role}]});
                    });
                }
            });
        }
    } catch (err) {
        console.error(err);
        res.json({ message: err });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});