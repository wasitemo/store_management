import express from "express";
import env from "dotenv";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import pg from "pg";
import session from "express-session";
import passport from "passport";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import XLSX from "xlsx";
import path from "path";
import { Strategy } from "passport-local";

env.config();
pg.types.setTypeParser(1082, val => val);
const app = express();
const saltRounds = 12;
const upload = multer({ dest: "uploads" });
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
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

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

    if (!employeeNik || !employeeName || !employeeAddress || !employeeContact) {
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
            const query = await db.query("INSERT INTO employee (employee_nik, employee_name, employee_contact, employee_address) VALUES ($1, $2, $3, $4) RETURNING *", [employeeNik, employeeName, employeeContact, employeeAddress]);
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
        res.status(404).json({
            status: 404,
            message: "Missing required key: stuffCategoryId, stuffBrandId, supplierId, stuffCode, stuffSku, stuffName, stuffVariant, currentSellPrice, hasSn, barcode"
        });
    }

    try {
        const query = await db.query(
            "INSERT INTO stuff (stuff_category_id, stuff_brand_id, supplier_id, stuff_code, stuff_sku, stuff_name, stuff_variant, current_sell_price, has_sn) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *", [stuffCategoryId, stuffBrandId, supplierId, stuffCode, stuffSku, stuffName, stuffVariant, currentSellPrice, hasSn, barcode]
        );
        const result = query.rows[0];

        res.json({
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
        res.status(404).json({
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

        res.status(200).json({
            status: 200,
            message: "Purchase success",
        });
    } catch (err) {
        await db.query("ROLLBACK");
        console.error(err);
        res.status(500).json({
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
                
                
            console.log(item);
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

        res.status(200).json({
            status: 200,
            message: "Success created data"
        });

        fs.unlinkSync(filePath);
    } catch (err) {
        await db.query("ROLLBACK");
        console.error(err.message);
        res.status(500).json({
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
    const employeeId = req.body.employeeId;
    const discountName = req.body.discountName;
    const discountTotal = parseFloat(req.body.discountTotal.replace(",", "."));
    const discountStart = req.body.discountStart;
    const discountEnd = req.body.discountEnd;
    const discountStatus = req.body.discountStatus;

    if (!employeeId || !discountName || !discountTotal || !discountStart || !discountEnd || discountStatus) {
        res.status(404).json({
            status: 404,
            message: "Missing required key: employeeId, discountName, discountTotal, discountStart, discountEnd, discountStatus"
        });
    }

    try {
        const query = await db.query("INSERT INTO discount (employee_id, discount_name, discount_total, started_time, ended_time, discount_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", [employeeId, discountName, discountTotal, discountStart, discountEnd, discountStatus]);
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

// STOCK
app.post("/add-stock", async (req, res) => {
    const warehouseId = req.body.warehouseId;
    const stuffId = req.body.stuffId;
    const quantity = req.body.quantity;
    const imei1 = req.body.imei1;
    const imei2 = req.body.imei2;
    const sn = req.body.sn;

    if (!warehouseId || !stuffId || !quantity || !imei1 || !imei2 || !sn) {
        res.status(404).json({
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

        res.json({
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
    const customerId = parseInt(req.body.customerId);
    const paymentMethodeId = parseInt(req.body.paymentMethodeId);
    const employeeId = parseInt(req.body.employeeId);
    const orderDate = req.body.orderDate;
    const payment = parseFloat(req.body.payment.replace(",", "."));
    const items = req.body.items;

    if (!customerId || !paymentMethodeId || !employeeId || !orderDate || !payment || !items) {
        return res.status(404).json({
            status: 404,
            message: "Missing required key: customerId, paymentMethodeId, employeeId, orderDate, payment, items[]"
        });
    }

    try {
        await db.query("BEGIN");

        let totalPayment = 0;

        for (const item of items) {
            const stuffId = parseInt(item.stuffId);
            const discountId = parseInt(item.discountId);
            const warehouseId = parseInt(item.warehouseId);
            let totalItem = parseInt(item.totalItem);
            
            if (!stuffId || !discountId || !warehouseId || !totalItem) {
                throw new Error("Invalid item data in items[]");
            }

            const discountQuery = await db.query("SELECT discount_total FROM discount WHERE discount_id = $1", [discountId]);
            const stuffQuery = await db.query("SELECT current_sell_price FROM stuff WHERE stuff_id = $1", [stuffId]);

            const discount = discountQuery.rows[0].discount_total;
            const stuffPrice = stuffQuery.rows[0].current_sell_price;

            const discountPrice = stuffPrice * (discount / 100);
            const totalPerItem = (stuffPrice - discountPrice) * totalItem

            totalPayment += totalPerItem;
        }

        const remainingPayment = payment - totalPayment;

        if (remainingPayment < 0) {
            throw new Error("You don't have enough money.");
        }

        const orderQuery = await db.query("INSERT INTO customer_order (customer_id, payment_methode_id, employee_id, order_date, payment, total_payment, remaining_payment) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING order_id", [customerId, paymentMethodeId, employeeId, orderDate, payment, totalPayment, remainingPayment]);
            
        const orderId = orderQuery.rows[0].order_id;

        for (const item of items)
        {
            const stuffId = parseInt(item.stuffId);
            const discountId = parseInt(item.discountId);
            const warehouseId = parseInt(item.warehouseId);
            let totalItem = parseInt(item.totalItem);

            const stockQuery = await db.query("SELECT quantity FROM stock WHERE warehouse_id = $1 AND stuff_id = $2 FOR UPDATE", [warehouseId, stuffId]);

            if (stockQuery.rows.length === 0) {
                throw new Error(`stuff id ${stuffId} not found in warehouse ${warehouseId}`);
            }

            const currentStock = stockQuery.rows[0].quantity;

            if (currentStock < totalItem) {
                throw new Error(`Insufficient stock for stuff_id ${stuffId}`);
            }

            await db.query("UPDATE stock SET quantity = quantity - $1 WHERE warehouse_id = $2 AND stuff_id = $3", [totalItem, warehouseId, stuffId]);

            await db.query("INSERT INTO customer_detail_order (stuff_id, discount_id, order_id, warehouse_id, total_item) VALUES ($1, $2, $3, $4, $5)", [stuffId, discountId, orderId, warehouseId, totalItem]);
        }

        await db.query("COMMIT");

        return res.status(200).json({
        status: 200,
        message: "Order successfully created",
        orderId,
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