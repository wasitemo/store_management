import express from "express";
import env from "dotenv";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import pg from "pg";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import XLSX from "xlsx";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

env.config();
pg.types.setTypeParser(1082, val => val);
const app = express();
const saltRounds = process.env.SALT_ROUNDS;
const upload = multer({ dest: "uploads" });
const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
});
db.connect();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

function parseCSV(filePath)
{
    return new Promise((resolve, reject) => {
        const results = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => results.push(row))
            .on("end", () => resolve(results))
            .on("error", reject);
    });
}

function excelDateToJsDate(serial)
{
    let utc_days = Math.floor(serial - 25569);
    let utc_value = utc_days * 86400;
    let date_info = new Date(utc_value * 1000);
    let date = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());

    return new Date(date);
}

function parseExcel(filePath)
{
    const workBook = XLSX.readFile(filePath);
    const sheet = workBook.Sheets[workBook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    const formattedData = jsonData.map(row => { 
        const formattedRow = {};

        for (const [key, value] of Object.entries(row))
        {
            if (typeof value === "number" && key.toLocaleLowerCase().includes("buy_date"))
            {
                formattedRow[key] = excelDateToJsDate(value);
            }
            else
            {
                formattedRow[key] = value;
            }
        }

        return formattedRow;
    });

    return formattedData;
}

function generateAccessToken(account) 
{
    return jwt.sign(
        { id: account.id, username: account.username },
        process.env.JWT_ACCESS_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRE}
    );
}

function generateRefreshToken(account) {
    return jwt.sign(
        { id: account.id },
        process.env.JWT_REFRESH_SECRET,
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRE}
    );
}

async function verifyToken(req, res, next)
{
    let authHeader = req.headers["authorization"];
    let token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({
            status: 401,
            message: "Access token required"
        });
    }

    jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET, (err, account) => {
            if (err) {
                return res.status(403).json({
                    status: 403,
                    message: "Invalid or expired token"
                });
            }

            req.user = account;
            next();
        }
    );
}

// EMPLOYEE
app.get("/employee", verifyToken, async (req, res) => {
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

    if (!employeeNik || !employeeName || !employeeAddress || !employeeContact) {
        return res.status(404).json({
            status: 400,
            message: "Missing required key: employeeNik, employeeName, employeeAddress, employeeContact",
        });
    }

    try {
        const checkResult = await db.query("SELECT * FROM employee WHERE employee_nik = $1", [employeeNik]);

        if (checkResult.rows.length > 0) {
            return res.status(404).json({
                status: 404,
                message: "NIK already used",
            });
        }
        else
        {
            const query = await db.query("INSERT INTO employee (employee_nik, employee_name, employee_contact, employee_address) VALUES ($1, $2, $3, $4) RETURNING *", [employeeNik, employeeName, employeeContact, employeeAddress]);
            const result = query.rows[0];

            return res.status(200).json({
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
        return res.status(404).json({
            status: 404,
            message: "Missing required key: warehouseName, warehouseAddress"
        });
    }

    try {
        const query = await db.query("INSERT INTO warehouse (warehouse_name, warehouse_address) VALUES ($1, $2) RETURNING *", [warehouseName, warehouseAddress]);
        const result = query.rows[0];

        return res.status(200).json({
            status: 200,
            message: "OK",
            data: result,
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
        return res.status(404).json({
            status: 404,
            message: "Missing required key: supplierName, supplierContact, supplierAddress"
        });
    }

    try {
        const query = await db.query("INSERT INTO supplier (supplier_name, supplier_contact, supplier_address) VALUES ($1, $2, $3) RETURNING *", [supplierName, supplierContact, supplierAddress]);
        const result = query.rows[0];

        return res.status(200).json({
            status: 200,
            message: "OK",
            data: result,
        });
    } catch (err) {
        console.log(err);
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

        return res.status(200).json({
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
        return res.status(404).json({
            status: 404,
            message: "Missing required key: stuffBrandName"
        });
    }

    try {
        const query = await db.query("INSERT INTO stuff_brand (stuff_brand_name) VALUES ($1) RETURNING *", [stuffBrandName]);
        const result = query.rows[0];

        return res.status(200).json({
            status: 200,
            message: "OK",
            data: result
        });
    } catch (err) {
        console.log(err);
    }
});

app.post("/add-stuff", async (req, res) => { 
    const stuffCategoryId = req.body.stuffCategoryId;
    const stuffBrandId = req.body.stuffBrandId;
    const supplierId = req.body.supplierId;
    const stuffCode = req.body.stuffCode;
    const stuffSku = req.body.stuffSku;
    const stuffName = req.body.stuffName;
    const stuffVariant = req.body.stuffVariant;
    const currentSellPrice = parseFloat(req.body.currentSellPrice.replace(",", "."));
    const hasSn = req.body.hasSn;
    const barcode = req.body.barcode;

    if (!stuffCategoryId || !stuffBrandId || !supplierId || !stuffCode || !stuffSku || !stuffName || !stuffVariant || !currentSellPrice || !hasSn || !barcode) {
        return res.status(404).json({
            status: 404,
            message: "Missing required key: stuffCategoryId, stuffBrandId, supplierId, stuffCode, stuffSku, stuffName, stuffVariant, currentSellPrice, hasSn, barcode"
        });
    }

    try {
        const query = await db.query(
            "INSERT INTO stuff (stuff_category_id, stuff_brand_id, supplier_id, stuff_code, stuff_sku, stuff_name, stuff_variant, current_sell_price, has_sn) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *", [stuffCategoryId, stuffBrandId, supplierId, stuffCode, stuffSku, stuffName, stuffVariant, currentSellPrice, hasSn, barcode]
        );
        const result = query.rows[0];

        return res.json({
            status: 200,
            message: "OK",
            data: result,
        });
    } catch (err) {
        console.error(err);
    }
});

app.post("/add-stuff-purchase", async (req, res) => {
    let { supplierId, employeeId, buyDate, totalPrice, warehouseId, stuffId, buyBatch, quantity, buyPrice, sellPrice } = req.body;
  
    if (!supplierId || !employeeId || !buyDate || !totalPrice || !warehouseId || !stuffId || !buyBatch || !quantity || !buyPrice || !sellPrice) {
        return res.status(404).json({
            status: 404,
            message: "Missing required key: supplierId, employeeId, buyDate, totalPrice, warehouseId, stuffId, buyBatch, quantity, buyPrice, sellPrice"
        });
    }

    try {

        await db.query("BEGIN");

        const stuffPurchase = await db.query("INSERT INTO stuff_purchase (supplier_id, employee_id, buy_date, total_price) VALUES ($1, $2, $3, $4) RETURNING stuff_purchase_id", [supplierId, employeeId, buyDate, totalPrice]);
        
        const purchaseId = stuffPurchase.rows[0].stuff_purchase_id;
        
        await db.query("INSERT INTO stuff_purchase_detail (warehouse_id, stuff_id, stuff_purchase_id, buy_batch, quantity, buy_price, sell_price) VALUES ($1, $2, $3, $4, $5, $6, $7)", [warehouseId, stuffId, purchaseId, buyBatch, quantity, buyPrice, sellPrice]);
        
        await db.query("COMMIT");

        return res.status(200).json({
            status: 200,
            message: "Purchase success",
        });
    } catch (err) {
        await db.query("ROLLBACK");
        console.error(err);
        return res.status(500).json({
            status: 500,
            message: err.message
        });
    }
});

app.post("/add-purchase-file", upload.single("file"), async (req, res) => { 
    if (!req.file) {
        return res.status(400).json({
            status: "404",
            message: "File not found",
        });
    }

    const filePath = req.file.path;
    const ext = req.file.originalname.split(".").pop().toLocaleLowerCase();
    let rows = [];

    try {
        if (ext === "csv") {
            rows = await parseCSV(filePath);
        }
        else if (ext === "xlsx" || ext === "xls")
        {
            rows = parseExcel(filePath);
        }
        else
        {
            throw new Error("File format must be csv or excel");
            
        }

        if (rows.length === 0) {
            throw new Error("Empty file or format is wrong");
        }

        await db.query("BEGIN");

        for (let i = 0; i < rows.length; i++)
        {
            let item = rows[i];

             for (let key in item)
            {
                if (typeof item[key] === 'string') {
                    item[key] = item[key].toLowerCase().trim();
                }
            }

            
            let {
                    supplier_name,
                    employee_name,
                    buy_date,
                    total_price,
                    warehouse_name,
                    stuff_name,
                    buy_batch,
                    quantity,
                    buy_price,
                    sell_price
                } = item;
                
            let supplierQuery = await db.query("SELECT supplier_id FROM supplier WHERE LOWER (supplier_name) = $1", [supplier_name]);
            if(supplierQuery.rows.length === 0) throw new Error("Supplier not registered")
            let supplierId = supplierQuery.rows[0].supplier_id;
                
            let employeeQuery = await db.query("SELECT employee_id FROM employee WHERE LOWER (employee_name) = $1", [employee_name]);
             if(employeeQuery.rows.length === 0) throw new Error("Employee not registered")
            let employeeId = employeeQuery.rows[0].employee_id;

            let warehouseQuery = await db.query("SELECT warehouse_id FROM warehouse WHERE LOWER (warehouse_name) = $1", [warehouse_name]);
            if(warehouseQuery.rows.length === 0) throw new Error("Warehouse not registered")
            let warehouseId = warehouseQuery.rows[0].warehouse_id;

            let stuffQuery = await db.query("SELECT stuff_id FROM stuff WHERE LOWER (stuff_name) = $1", [stuff_name]);
             if(stuffQuery.rows.length === 0) throw new Error("Stuff not registered")
            let stuffId = stuffQuery.rows[0].stuff_id;

            let purchaseQuery = await db.query("INSERT INTO stuff_purchase (supplier_id, employee_id, buy_date, total_price) VALUES ($1, $2, $3, $4) RETURNING stuff_purchase_id", [supplierId, employeeId, buy_date, total_price]);
            let purchaseId = purchaseQuery.rows[0].stuff_purchase_id;

            await db.query("INSERT INTO stuff_purchase_detail (warehouse_id, stuff_id, stuff_purchase_id, buy_batch, quantity, buy_price, sell_price) VALUES ($1, $2, $3, $4, $5, $6, $7)", [warehouseId, stuffId, purchaseId, buy_batch, quantity, buy_price, sell_price]);
        }

        await db.query("COMMIT");

        fs.unlinkSync(filePath);
        
        return res.status(200).json({
            status: 200,
            message: "Success created data"
        });
    } catch (err) {
        await db.query("ROLLBACK");
        console.error(err.message);
        return res.status(500).json({
            status: 500,
            message: err.message
        });
    }
});

// CUSTOMER
app.post("/add-customer", async (req, res) => {
    const customerName = req.body.customerName;
    const customerContact = req.body.customerContact;
    const customerAddress = req.body.customerAddress;

    if (!customerName || !customerContact || !customerAddress) {
        return res.status(404).json({
            status: 404,
            message: "Missing required key: customerName, customerContact, customerAddress"
        });
    }

    try {
        const query = await db.query("INSERT INTO customer (customer_name, customer_contact, customer_address) VALUES ($1, $2, $3) RETURNING *", [customerName, customerContact, customerAddress]);
        const result = query.rows[0];

        return res.status(200).json({
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
        return res.status(404).json({
            status: 404,
            message: "Missing required key: paymentMethodeName"
        });
    }

    try {
        const query = await db.query("INSERT INTO payment_methode (payment_methode_name) VALUES ($1) RETURNING *", [paymentMethodeName]);
        const result = query.rows[0];

        return res.status(200).json({
            status: 200,
            message: "OK",
            data: result,
        });
    } catch (err) {
        console.error(err);
    }
});

// DISCOUNT
app.post("/add-stuff-discount", verifyToken, async (req, res) => {
     
    let employeeId = req.body.employeeId;
    let stuffId = req.body.stuffId;
    let discountName = req.body.discountName;
    let discountType = req.body.discountType.toLowerCase();
    let discountValue = req.body.discountValue;
    let discountStart = req.body.discountStart;
    let discountEnd = req.body.discountEnd;
    let discountStatus = req.body.discountStatus;

    if (typeof discountValue === "string" && discountValue.includes(",")) {
        let newValue = discountValue.replace(",", ".");
        let parse = parseFloat(newValue);

        if (!isNaN(parse)) {
            discountValue = parse;
        }
    }

    if (!employeeId) {
        return res.status(404).json({
            status: 404,
            message: "Missing required key employeeId"
        });
    }
    else if (!stuffId)
    {
        return res.status(404).json({
            status: 404,
            message: "Missing required key stuffId"
        });
    }
    else if (!discountName)
    {
        return res.status(404).json({
            status: 404,
            message: "Missing required key discountName"
        });
    }
    else if (!discountValue)
    {
        return res.status(404).json({
            status: 404,
            message: "Missing required key discountValue"
        });
    }
    else if (!discountStart)
    {
        return res.status(404).json({
            status: 404,
            message: "Missing required key discountStart"
        });
    }
    else if (!discountEnd)
    {
        return res.status(404).json({
            status: 404,
            message: "Missing required key discountEnd"
        });
    }
    else if (!discountStatus)
    {
        return res.status(404).json({
            status: 404,
            message: "Missing required key discountStatus"
        });
    }

    try {
        await db.query("BEGIN");

        let discountQuery = await db.query("INSERT INTO discount (employee_id, discount_name, discount_type, discount_value, started_time, ended_time, discount_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING discount_id", [employeeId, discountName, discountType, discountValue, discountStart, discountEnd, discountStatus]);

        let discountId = discountQuery.rows[0].discount_id;

        await db.query("INSERT INTO stuff_discount (stuff_id, discount_id) VALUES ($1, $2)", [stuffId, discountId]);

        await db.query("COMMIT");

        return res.status(200).json({
            status: 200,
            message: "Success",
        });
    } catch (err) {
        db.query("ROLLBACK");
        console.error(err);
        return res.status(404).json({
            status: 404,
            message: err.message
        });
    }
});

app.post("/add-order-discount", verifyToken, async (req, res) => {
     
    let employeeId = req.body.employeeId;
    let stuffId = req.body.stuffId;
    let discountName = req.body.discountName;
    let discountType = req.body.discountType.toLowerCase();
    let discountValue = req.body.discountValue;
    let discountStart = req.body.discountStart;
    let discountEnd = req.body.discountEnd;
    let discountStatus = req.body.discountStatus;

    if (typeof discountValue === "string" && discountValue.includes(",")) {
        let newValue = discountValue.replace(",", ".");
        let parse = parseFloat(newValue);

        if (!isNaN(parse)) {
            discountValue = parse;
        }
    }

    if (!employeeId) {
        return res.status(404).json({
            status: 404,
            message: "Missing required key employeeId"
        });
    }
    else if (!stuffId)
    {
        return res.status(404).json({
            status: 404,
            message: "Missing required key stuffId"
        });
    }
    else if (!discountName)
    {
        return res.status(404).json({
            status: 404,
            message: "Missing required key discountName"
        });
    }
    else if (!discountValue)
    {
        return res.status(404).json({
            status: 404,
            message: "Missing required key discountValue"
        });
    }
    else if (!discountStart)
    {
        return res.status(404).json({
            status: 404,
            message: "Missing required key discountStart"
        });
    }
    else if (!discountEnd)
    {
        return res.status(404).json({
            status: 404,
            message: "Missing required key discountEnd"
        });
    }
    else if (!discountStatus)
    {
        return res.status(404).json({
            status: 404,
            message: "Missing required key discountStatus"
        });
    }

    try {
        await db.query("INSERT INTO discount (employee_id, discount_name, discount_type, discount_value, started_time, ended_time, discount_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING discount_id", [employeeId, discountName, discountType, discountValue, discountStart, discountEnd, discountStatus]);

        return res.status(200).json({
            status: 200,
            message: "Success",
        });
    } catch (err) {
        console.error(err);
        return res.status(404).json({
            status: 404,
            message: err.message
        });
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
            return res.status(404).json({
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
                        return res.status(200).json({
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

app.post("/login", async (req, res) => {
    let { username, password } = req.body;
    const accountQuery = await db.query("SELECT * FROM employee_account WHERE username = $1", [username]);
    
    try {
        
        if (accountQuery.rows.length > 0) {
            const account = accountQuery.rows[0];
            const hashPassword = account.password;

            if (!account) {
                return res.status(401).json({
                    status: 401,
                    message: "Invalid credentials"
                });
            }

            bcrypt.compare(password, hashPassword, async (err, valid) => {
                if (err) {
                    console.error("Error comparing password: ", err);
                    return cb(err);
                }
                else
                {
                    if (valid) {
                        let accessToken = generateAccessToken(account);
                        let refreshToken = generateRefreshToken(account);
                        let expiresAt = new Date();

                        expiresAt.setDate(expiresAt.getDay() + 7);

                        await db.query("INSERT INTO refresh_token (employee_account_id, token_jti, expires_at) VALUES ($1, $2, $3)", [account.employee_account_id, refreshToken, expiresAt]);

                        res.cookie("refreshToken", refreshToken, {
                            httpOnly: true,
                            secure: false,
                            sameSite: "strict",
                            maxAge: 7 * 24 * 60 * 60 * 1000
                        });

                        return res.status(200).json({
                            status: 200,
                            message: accessToken,
                        });
                    }
                    else
                        {
                            return cb(null, false);
                        }
                    }
                });
        }
        else
        {
            return cb("Account not found");
        }
    } catch (err) {
        return console.error(err);
    }
});

app.use("/refresh-token", async (req, res) => {
    try {
        let refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                status: 401,
                message: "No refresh token provided"
            });
        }

        let query = await db.query("SELECT * FROM refresh_token WHERE token_jti = $1", [refreshToken]);
        let queryToken = query.rows[0];

        if (!queryToken) {
            return res.status(403).json({
                status: 403,
                message: "Invalid refresh token"
            });
        }

        jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET, (err, account) => 
            {
                if (err) {
                    return res.status(403).json({
                        status: 403,
                        message: "Token is no longer valid"
                    });
                }

                let newAccessToken = generateAccessToken(account);
                
                res.status(200).json({
                    status: 200,
                    message: newAccessToken
                });
            }
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: 500,
            message: "Server error"
        });
    }
});

app.post("/logout", async (req, res) => {
    try {
        let refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
            await db.query("DELETE from refresh_token WHERE token_jti = $1", [refreshToken]);
            res.clearCookie("refreshToken");
        }

        return res.status(200).json({
            status: 200,
            message: "Logout successfully"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: 500,
            message: "Server error"
        });
    }
});

// STOCK
app.post("/add-stock", async (req, res) => {
    const warehouseId = req.body.warehouseId;
    const stuffId = req.body.stuffId;
    const quantity = req.body.quantity;
    const imei1 = req.body.imei1;
    const imei2 = req.body.imei2;
    const sn = req.body.sn;

    if (!warehouseId || !stuffId || !quantity || !imei1 || !imei2 || !sn) {
        return res.status(404).json({
            status: 404,
            message: "Missing required key: warehouseId, stuffId, quantity, imei1, imei2, sn"
        });
    }

    try {
        await db.query("BEGIN");

        const stuffInfoQuery = await db.query("INSERT INTO stuff_information (stuff_id, imei_1, imei_2, sn) VALUES ($1, $2, $3, $4) RETURNING stuff_information_id", [stuffId, imei1, imei2, sn]);
        const stuffInfoId = stuffInfoQuery.rows[0].stuff_information_id;

        await db.query(
            "INSERT INTO stock (warehouse_id, stuff_id, stuff_information_id, quantity) VALUES ($1, $2, $3, $4) RETURNING *", [warehouseId, stuffId, stuffInfoId, quantity]
        );
        
        await db.query("COMMIT");

        return res.json({
            status: 200,
            message: "Succes update stock",
        });
    } catch (err) {
        await db.query("ROLLBACK");
        console.error(err);
    }
});

// CUSTOMER ORDER
app.post("/add-order", async (req, res) => {

    //belum buat code untuk update stocknya dan input ke databasenya baru selesai mengurus perhitungan discountnya

    const customerId = parseInt(req.body.customerId);
    const employeeId = parseInt(req.body.employeeId);
    const warehouseId = req.body.warehouseId;
    const paymentMethodeId = parseInt(req.body.paymentMethodeId);
    const orderDate = req.body.orderDate;
    const payment = req.body.payment;
    const items = req.body.items;
    const discounts = req.body.discounts;

    if (typeof payment === "string" && payment.includes(",")) {
        let newValue = discountValue.replace(",", ".");
        let parse = parseFloat(newValue);

        if (!isNaN(parse)) {
            discountValue = parse;
        }
    }

    if (!customerId) {
        return res.status(404).json({
            status: 404,
            message: "Missing required key: customerId"
        });
    }
    else if (!employeeId)
    {
        return res.status(404).json({
            status: 404,
            message: "Missing required key: employeeId"
        });
    }
    else if (!warehouseId)
        {
            return res.status(404).json({
                status: 404,
                message: "Missing required key: warehouseId"
            });
        }
    else if (!paymentMethodeId)
    {
        return res.status(404).json({
                status: 404,
                message: "Missing required key: paymentMethodeId"
        });
    }
    else if (!orderDate)
    {
        return res.status(404).json({
            status: 404,
            message: "Missing required key: orderDate"
        });
    }
    else if (!payment)
    {
        return res.status(404).json({
            status: 404,
            message: "Missing required key: payment"
        });
    }

    try {
        await db.query("BEGIN");
    
        let totalPayment = 0;
        let grandTotalItem = 0
        let remainingPayment;
        let saveTotalDiscountItem = 0;
        let savetotalDiscountOrder = 0;
        let quantity = 0;

        for (let i = 0; i < items.length; i++)
        {
            let totalDiscountItem = 0;
            const discountItemQuery = await db.query(`
                SELECT
                stuff.stuff_id,
                stuff.stuff_name, 
                stuff.current_sell_price, 
                json_agg(
                    DISTINCT jsonb_build_object(
                        'discount_type', discount.discount_type,
                        'discount_status', discount.discount_status,
                        'discount_value', discount.discount_value
                    )
                ) AS discounts
                FROM stuff
                LEFT JOIN stuff_discount ON stuff.stuff_id = stuff_discount.stuff_id
                LEFT JOIN discount ON stuff_discount.discount_id = discount.discount_id
                WHERE stuff.stuff_id = $1
                GROUP BY stuff.stuff_id, stuff.stuff_name, stuff.current_sell_price`, [items[i].stuff_id]
            );

            if (!items[i].stuff_id) {
                    return res.status(404).json({
                    status: 404,
                    message: "Missing required key: stuff_id"
                });
            }
            
            for (let j = 0; j < discountItemQuery.rows.length; j++) {
                let itemData = discountItemQuery.rows[j];
                
                for (let k of itemData.discounts)
                {
                    if (k.discount_status === true) {
                        if (k.discount_type === "percentage") {
                            totalDiscountItem += itemData.current_sell_price * (k.discount_value / 100);
                            saveTotalDiscountItem += itemData.current_sell_price * (k.discount_value / 100);
                        }
                        else if (k.discount_type === "fixed")
                        {
                            totalDiscountItem += k.discount_value;
                            saveTotalDiscountItem += k.discount_value;
                        }
                    }

                }
                
                itemData.current_sell_price = parseFloat(itemData.current_sell_price) - totalDiscountItem;
                grandTotalItem += itemData.current_sell_price;

            }

            quantity = items.length;
        }
        
        for (let i = 0; i < discounts.length; i++)
        {
            let discountOrderQuery = await db.query("SELECT discount_id, discount_type, discount_status, discount_value FROM discount WHERE discount_id = $1", [discounts[i].discount_id]);

            for (let j of discountOrderQuery.rows)
            {
                if (j.discount_type === "percentage") {
                    savetotalDiscountOrder += grandTotalItem * (parseFloat(j.discount_value) / 100);
                }
                else if (j.discount_type === "fixed")
                {
                    savetotalDiscountOrder += parseFloat(j.discount_value);
                }
            }

        }
        
        totalPayment = grandTotalItem - savetotalDiscountOrder;
        remainingPayment = payment - totalPayment;

        console.log(quantity);
        
        await db.query("COMMIT");

        return res.status(200).json({
        status: 200,
        message: "Order successfully created",
    });
    } catch (err) {
        await db.query("ROLLBACK");
        console.error("Transaction failed:", err.message);
        return res.status(500).json({
            status: 500,
            message: err.message
        });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});