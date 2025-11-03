import express from "express";
import env from "dotenv";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import pg from "pg";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";

env.config();
pg.types.setTypeParser(1082, val => val);
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

// EMPLOYEE
app.get("/employee", async (req, res) => {
    try {
        const query = await db.query("SELECT * FROM employee");
        const result = query.rows;

        res.status(200).json({
            status: 200,
            message: "OK",
            data: result,
        });
    } catch (err) {
        console.error(err);
    }
});

app.post("/add-employee", async (req, res) => { 
    const employeeNik = req.body.employeeNik;
    const employeeName = req.body.employeeName;
    const employeeAddress = req.body.employeeAddress;
    const employeeContact = req.body.employeeContact;

    if (!employeeNik || !employeeName || !employeeAddress || employeeContact) {
        res.status(404).json({
            status: 400,
            message: "Missing required key: employeeNik, employeeName, employeeAddress, employeeContact",
        });
    }

    try {
        const checkResult = await db.query("SELECT * FROM employee WHERE employee_nik = $1", [employeeNik]);

        if (checkResult.rows.length > 0) {
            res.status(404).json({
                status: 404,
                message: "NIK already used",
            });
        }
        else
        {
            const query = await db.query("INSERT INTO employee (employee_nik, employee_name, employee_address, employee_contact) VALUES ($1, $2, $3, $4) RETURNING *", [employeeNik, employeeName, employeeAddress, employeeContact]);
            const result = query.rows[0];

            res.status(200).json({
                status: 200,
                message: "OK",
                data: result,
            });
        }
    } catch (err) {
        console.error(err);
    }
});

// WAREHOUSE
app.post("/add-warehouse", async (req, res) => { 
    const warehouseName = req.body.warehouseName;
    const warehouseAddress = req.body.warehouseAddress;

    if (!warehouseName || !warehouseAddress) {
        res.status(404).json({
            status: 404,
            message: "Missing required key: warehouseName, warehouseAddress"
        });
    }

    try {
        const query = await db.query("INSERT INTO warehouse (warehouse_name, warehouse_address) VALUES ($1, $2) RETURNING *", [warehouseName, warehouseAddress]);
        const result = query.rows[0];

        res.status(200).json({
            status: 200,
            message: "OK",
            data: result,
        });
    } catch (err) {
        console.error(err);
    }
});

// STUFF
app.use("/add-stuff-category", async (req, res) => { 
    const stuffCategoryName = req.body.stuffCategoryName;

    if (!stuffCategoryName)
    {
        return res.status(404).json({
            status: 404,
            message: "Missing required key: stuffCategoryName"
        });
    }

    try {
        const query = await db.query("INSERT INTO stuff_category (stuff_category_name) VALUES ($1) RETURNING *", [stuffCategoryName]);
        const result = query.rows[0];

        res.status(200).json({
            status: 200,
            message: "OK",
            data: result
        });
    } catch (err) {
        console.error(err);
    }
});

app.post("/add-stuff-brand", async (req, res) => {
    const stuffBrandName = req.body.stuffBrandName;

    if (!stuffBrandName) {
        res.status(404).json({
            status: 404,
            message: "Missing required key: stuffBrandName"
        });
    }

    try {
        const query = await db.query("INSERT INTO stuff_brand (stuff_brand_name) VALUES ($1) RETURNING *", [stuffBrandName]);
        const result = query.rows[0];

        res.status(200).json({
            status: 200,
            message: "OK",
            data: result
        });
    } catch (err) {
        console.log(err);
    }
});

app.post("/add-stuff-purchase", async (req, res) => { 
    const supplierId = req.body.supplierId;
    const employeeId = req.body.employeeId;
    const buyDate = req.body.buyDate;
    const totalPrice = req.body.totalPrice;

    if (!supplierId || !employeeId || !buyDate || !totalPrice) {
        res.status(404).json({
            status: 404,
            message: "Missing required key: supplierId, employeeId, buyDate, totalPrice"
        });
    }

    try {
        const query = await db.query("INSERT INTO stuff_purchase (supplier_id, employee_id, buy_date, total_price) VALUES ($1, $2, $3, $4) RETURNING *", [supplierId, employeeId, buyDate, totalPrice]);
        const result = query.rows[0];

        res.status(200).json({
            status: 200,
            message: "OK",
            data: result
        });
    } catch (err) {
        console.error(err);
    }
});

// SUPPLIER
app.post("/add-supplier", async (req, res) => { 
    const supplierName = req.body.supplierName;
    const supplierContact = req.body.supplierContact;
    const supplierAddress = req.body.supplierAddress;

    if (!supplierName || !supplierContact || !supplierAddress) {
        res.status(404).json({
            status: 404,
            message: "Missing required key: supplierName, supplierContact, supplierAddress"
        });
    }

    try {
        const query = await db.query("INSERT INTO supplier (supplier_name, supplier_contact, supplier_address) VALUES ($1, $2, $3) RETURNING *", [supplierName, supplierContact, supplierAddress]);
        const result = query.rows[0];

        res.status(200).json({
            status: 200,
            message: "OK",
            data: result,
        });
    } catch (err) {
        console.log(err);
    }
});

// CUSTOMER
app.post("/add-customer", async (req, res) => {
    const customerName = req.body.customerName;
    const customerContact = req.body.customerContact;
    const customerAddress = req.body.customerAddress;

    if (!customerName || !customerContact || !customerAddress) {
        res.status(404).json({
            status: 404,
            message: "Missing required key: customerName, customerContact, customerAddress"
        });
    }

    try {
        const query = await db.query("INSERT INTO customer (customer_name, customer_contact, customer_address) VALUES ($1, $2, $3) RETURNING *", [customerName, customerContact, customerAddress]);
        const result = query.rows[0];

        res.status(200).json({
            status: 200,
            message: "OK",
            data: result,
        });
    } catch (err) {
        console.error(err);
    }
});
 
// PAYMENT METHODE
app.post("/add-payment-methode", async (req, res) => {
    const paymentMethodeName = req.body.paymentMethodeName;

    if (!paymentMethodeName) {
        res.status(404).json({
            status: 404,
            message: "Missing required key: paymentMethodeName"
        });
    }

    try {
        const query = await db.query("INSERT INTO payment_methode (payment_methode_name) VALUES ($1) RETURNING *", [paymentMethodeName]);
        const result = query.rows[0];

        res.status(200).json({
            status: 200,
            message: "OK",
            data: result,
        });
    } catch (err) {
        console.error(err);
    }
});

// DISCOUNT
app.post("/add-discount", async (req, res) => { 
    const discountName = req.body.discountName;
    const discountTotal = parseFloat(req.body.discountTotal.replace(",", "."));
    const discountStart = req.body.discountStart;
    const discountEnd = req.body.discountEnd;

    if (!discountName || !discountTotal || !discountStart || !discountEnd) {
        res.status(404).json({
            status: 404,
            message: "Missing required key: discountName, discountTotal, discountStart, discountEnd"
        });
    }

    try {
        const query = await db.query("INSERT INTO discount (discount_name, discount_total, started_time, ended_time) VALUES ($1, $2, $3, $4) RETURNING *", [discountName, discountTotal, discountStart, discountEnd]);
        const result = query.rows[0];

        res.status(200).json({
            status: 200,
            message: "OK",
            data: result,
        });
    } catch (err) {
        console.error(err);
    }
});

// ACCOUNT
app.post("/create-account", async (req, res) => {
    const employeeId = req.body.employeeId;
    const username = req.body.username;
    const password = req.body.password;
    const role = req.body.role;

    if (!employeeId || !username || !password || !role) {
        return res.status(400).json({
            status: 404,
            message: "Missing required key: employeeId, username, password, role",
        });
    }

    try {
        const checkResult = await db.query("SELECT * FROM employee_account WHERE username = $1", [username]);

        if (checkResult.rows.length > 0) {
            res.status(404).json({
                status: 404,
                message: "Username already used"
            });
        }
        else
        {
            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if (err)
                {
                    console.error("Error hashing password : ", err);
                }
                else
                {
                    const query = await db.query("INSERT INTO employee_account (employee_id, username, password, role) VALUES ($1, $2, $3, $4)", [employeeId, username, hash, role]);
                    const account = await query.rows[0];

                    req.login(account, (err) => {
                        res.status(200).json({
                            status: 200,
                            message: "Create account success",
                            data: [{
                                employeeId: employeeId,
                                username: username,
                                password: password,
                                role: role
                            }]
                        });
                    });
                }
            });
        }
    } catch (err) {
        console.error(err);
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});