import "dotenv/config";
import store from "./src/config/store.js";
import express from "express";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import XLSX from "xlsx";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import errorHandler from "./src/middleware/errorHandler.js";
import employeeRoute from "./src/route/employeeRoute.js";

const app = express();
const saltRounds = 12;
const upload = multer({ dest: "uploads" });
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

function excelDateToJsDate(serial) {
  let utc_days = Math.floor(serial - 25569);
  let utc_value = utc_days * 86400;
  let date_info = new Date(utc_value * 1000);
  let date = new Date(
    date_info.getFullYear(),
    date_info.getMonth(),
    date_info.getDate()
  );

  return new Date(date);
}

function parseExcel(filePath) {
  const workBook = XLSX.readFile(filePath);
  const sheet = workBook.Sheets[workBook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(sheet);

  const formattedData = jsonData.map((row) => {
    const formattedRow = {};

    for (const [key, value] of Object.entries(row)) {
      if (
        typeof value === "number" &&
        key.toLocaleLowerCase().includes("buy_date")
      ) {
        formattedRow[key] = excelDateToJsDate(value);
      } else {
        formattedRow[key] = value;
      }
    }

    return formattedRow;
  });

  return formattedData;
}

function generateAccessToken(account) {
  return jwt.sign(
    { id: account.employee_account_id, username: account.username },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRE }
  );
}

function generateRefreshToken(account) {
  return jwt.sign(
    { id: account.employee_account_id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE }
  );
}

async function verifyToken(req, res, next) {
  let authHeader = req.headers["authorization"];
  let token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      status: 401,
      message: "Access token required",
    });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, account) => {
    if (err) {
      return res.status(401).json({
        status: 401,
        message: "Invalid or expired token",
      });
    }

    req.user = account;
    next();
  });
}

function convertionToNumber(value) {
  if (value.includes(".") || value.includes(",")) {
    let newValue = value.replaceAll(".", "").replace(",", "");
    let parsed = parseFloat(newValue);

    if (!isNaN(parsed)) {
      return (value = parsed);
    }
  } else {
    return parseFloat(value);
  }
}

function convertionToDecimal(value) {
  if (value.includes(",")) {
    let newValue = value.replace(",", ".");
    let parsed = parseFloat(newValue);

    if (!isNaN(parsed)) {
      return (value = parsed);
    }
  } else {
    return parseFloat(value);
  }
}

app.use("/", employeeRoute);
// WAREHOUSE
app.get("/warehouses", verifyToken, async (req, res) => {
  try {
    let query = await store.query("SELECT * FROM warehouse");
    let result = query.rows;

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.post("/warehouse", verifyToken, async (req, res) => {
  let { warehouse_name, warehouse_address } = req.body;

  if (!warehouse_name) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: warehouse_name",
    });
  } else if (!warehouse_address) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: warehouse_address",
    });
  }

  if (typeof warehouse_name === "string") {
    warehouse_name = warehouse_name.trim();
  }

  if (typeof warehouse_address === "string") {
    warehouse_address = warehouse_address.trim();
  }

  try {
    await store.query(
      "INSERT INTO warehouse (warehouse_name, warehouse_address) VALUES ($1, $2)",
      [warehouse_name, warehouse_address]
    );

    return res.status(201).json({
      status: 201,
      message: "Success add warehouse",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/warehouse/:warehouse_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.warehouse_id);

  try {
    let query = await store.query(
      "SELECT * FROM warehouse WHERE warehouse_id = $1",
      [reqId]
    );
    let result = query.rows[0];

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.patch("/warehouse/:warehouse_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.warehouse_id);
  let update = req.body;
  let keys = Object.keys(update);
  let fields = ["warehouse_name", "warehouse_address"];
  let invalidField = keys.filter((k) => !fields.includes(k));

  if (invalidField.length > 0) {
    return res.status(400).json({
      status: 400,
      message: "Invalid field ",
      invalidField,
    });
  }

  if (keys.length === 0) {
    return res.status(400).json({
      status: 400,
      message: "No item updated",
    });
  }

  for (let k of keys) {
    if (typeof k === "string") {
      update[k] = update[k].trim();
    }
  }

  let setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(",");
  let values = Object.values(update);

  try {
    await store.query(
      `UPDATE warehouse SET ${setQuery} WHERE warehouse_id = $${
        keys.length + 1
      }`,
      [...values, reqId]
    );

    return res.status(200).json({
      status: 200,
      message: "Success updated data",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

// SUPPLIER
app.get("/suppliers", verifyToken, async (req, res) => {
  try {
    let query = await store.query("SELECT * FROM supplier");
    let result = query.rows;

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.post("/supplier", verifyToken, async (req, res) => {
  let { supplier_name, supplier_contact, supplier_address } = req.body;

  if (!supplier_name) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: supplier_name",
    });
  } else if (!supplier_contact) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: supplier_contact",
    });
  } else if (!supplier_address) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: supplier_address",
    });
  }

  if (typeof supplier_name === "string") {
    supplier_name = supplier_name.trim();
  }

  if (typeof supplier_contact === "string") {
    supplier_contact = supplier_contact.trim();
  }

  if (typeof supplier_address === "string") {
    supplier_address = supplier_address.trim();
  }

  try {
    await store.query(
      "INSERT INTO supplier (supplier_name, supplier_contact, supplier_address) VALUES ($1, $2, $3)",
      [supplier_name, supplier_contact, supplier_address]
    );

    return res.status(201).json({
      status: 201,
      message: "Success add supplier",
    });
  } catch (err) {
    console.log(err);
    return res.status(5000).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/supplier/:supplier_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.supplier_id);

  try {
    let query = await store.query(
      "SELECT * FROM supplier WHERE supplier_id = $1",
      [reqId]
    );
    let result = query.rows[0];

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.patch("/supplier/:supplier_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.supplier_id);
  let update = req.body;
  let keys = Object.keys(update);
  let fields = ["supplier_name", "supplier_contact", "supplier_address"];
  let invalidField = keys.filter((k) => !fields.includes(k));

  if (invalidField.length > 0) {
    return res.status(400).json({
      status: 400,
      message: "Invalid field ",
      invalidField,
    });
  }

  if (keys.length === 0) {
    return res.status(400).json({
      status: 400,
      message: "No item updated",
    });
  }

  for (let k of keys) {
    if (typeof k === "string") {
      update[k] = update[k].trim();
    }
  }

  let setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(",");
  let values = Object.values(update);

  try {
    await store.query(
      `UPDATE supplier SET ${setQuery} WHERE supplier_id = $${keys.length + 1}`,
      [...values, reqId]
    );

    return res.status(200).json({
      status: 200,
      message: "Success updated data",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

// STUFF
app.get("/stuff-categories", verifyToken, async (req, res) => {
  try {
    let query = await store.query("SELECT * FROM stuff_category");
    let result = query.rows;

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.post("/stuff-category", verifyToken, async (req, res) => {
  let { stuff_category_name } = req.body;

  if (!stuff_category_name) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: stuff_category_name",
    });
  }

  if (typeof stuff_category_name === "string") {
    stuff_category_name = stuff_category_name.trim();
  }

  try {
    await store.query(
      "INSERT INTO stuff_category (stuff_category_name) VALUES ($1)",
      [stuff_category_name]
    );

    return res.status(201).json({
      status: 201,
      message: "Success add stuff category",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/stuff-category/:stuff_category_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.stuff_category_id);

  try {
    let query = await store.query(
      "SELECT * FROM stuff_category WHERE stuff_category_id = $1",
      [reqId]
    );
    let result = query.rows[0];

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.patch(
  "/stuff-category/:stuff_category_id",
  verifyToken,
  async (req, res) => {
    let reqId = parseInt(req.params.stuff_category_id);
    let update = req.body;
    let keys = Object.keys(update);
    let fields = ["stuff_category_name"];
    let invalidFields = keys.filter((k) => !fields.includes(k));

    if (invalidFields.length > 0) {
      return res.status(400).json({
        status: 200,
        message: "Invalid field ",
        invalidFields,
      });
    }

    if (keys.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "No item updated",
      });
    }

    for (let k of keys) {
      if (typeof k === "string") {
        update[k] = update[k].trim();
      }
    }

    let setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(",");
    let values = Object.values(update);

    try {
      await store.query(
        `UPDATE stuff_category SET ${setQuery} WHERE stuff_category_id = $${
          keys.length + 1
        }`,
        [...values, reqId]
      );

      return res.status(200).json({
        status: 200,
        message: "Success updated data",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: 500,
        message: "Internal server error",
      });
    }
  }
);

app.get("/stuff-brands", verifyToken, async (req, res) => {
  try {
    let query = await store.query("SELECT * FROM stuff_brand");
    let result = query.rows;

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.post("/stuff-brand", verifyToken, async (req, res) => {
  let { stuff_brand_name } = req.body;

  if (!stuff_brand_name) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: stuff_brand_name",
    });
  }

  if (typeof stuff_brand_name === "string") {
    stuff_brand_name = stuff_brand_name.trim();
  }

  try {
    await store.query(
      "INSERT INTO stuff_brand (stuff_brand_name) VALUES ($1)",
      [stuff_brand_name]
    );

    return res.status(201).json({
      status: 201,
      message: "Success add stuff brand",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/stuff-brand/:stuff_brand_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.stuff_brand_id);

  try {
    let query = await store.query(
      "SELECT * FROM stuff_brand WHERE stuff_brand_id = $1",
      [reqId]
    );
    let result = query.rows[0];

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.patch("/stuff-brand/:stuff_brand_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.stuff_brand_id);
  let update = req.body;
  let keys = Object.keys(update);
  let fields = ["stuff_brand_name"];
  let invalidField = keys.filter((k) => !fields.includes(k));

  if (invalidField.length > 0) {
    return res.status(400).json({
      status: 400,
      message: "Invalid field ",
      invalidField,
    });
  }

  if (keys.length === 0) {
    return res.status(400).json({
      status: 400,
      message: "No item updated",
    });
  }

  for (let k of keys) {
    if (typeof k === "string") {
      update[k] = update[k].trim();
    }
  }

  let setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(",");
  let values = Object.values(update);

  try {
    await store.query(
      `UPDATE stuff_brand SET ${setQuery} WHERE stuff_brand_id = $${
        keys.length + 1
      }`,
      [...values, reqId]
    );

    return res.status(200).json({
      status: 200,
      message: "Success updated data",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/stuffs", async (req, res) => {
  try {
    let query = await store.query(`
      SELECT DISTINCT 
      stuff.stuff_id,
      stuff.stuff_name,
      stuff_category.stuff_category_name,
      stuff_brand.stuff_brand_name,
      supplier.supplier_name,
      stuff.stuff_code,
      stuff.stuff_sku,
      stuff.stuff_variant,
      stuff.current_sell_price,
      stuff.barcode,
      stuff.has_sn
      FROM stuff
      LEFT JOIN stuff_category ON stuff.stuff_category_id = stuff_category.stuff_category_id
      LEFT JOIN stuff_brand ON stuff.stuff_brand_id = stuff_brand.stuff_brand_id
      LEFT JOIN supplier ON stuff.supplier_id = supplier.supplier_id
    `);
    let result = query.rows;

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/imei-sn", verifyToken, async (req, res) => {
  try {
    let query = await store.query(`
      SELECT DISTINCT
      stuff_information.stuff_information_id,
      stuff_name,
      warehouse_name,
      imei_1,
      imei_2,
      sn,
      stock_status
      FROM stuff_information
      LEFT JOIN stuff ON stuff.stuff_id = stuff_information.stuff_id
      LEFT JOIN stock ON stock.stuff_information_id = stuff_information.stuff_information_id
      LEFT JOIN warehouse ON warehouse.warehouse_id = stock.warehouse_id  
    `);
    let result = query.rows;

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/stuff", verifyToken, async (req, res) => {
  try {
    let categoryQuery = await store.query("SELECT * FROM stuff_category");
    let brandQuery = await store.query("SELECT * FROM stuff_brand");
    let supplierQuery = await store.query("SELECT * FROM supplier");

    if (categoryQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Category data not found",
      });
    }

    if (brandQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Brand data not found",
      });
    }

    if (supplierQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Supplier data not found",
      });
    }

    let categoryResult = categoryQuery.rows;
    let brandResult = brandQuery.rows;
    let supplierResult = supplierQuery.rows;

    return res.status(200).json({
      status: 200,
      data: {
        stuff_category: categoryResult,
        stuff_brand: brandResult,
        supplier: supplierResult,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.post("/stuff", verifyToken, async (req, res) => {
  try {
    const body = req.body || {};

    let {
      stuff_category_id,
      stuff_brand_id,
      supplier_id,
      stuff_code,
      stuff_sku,
      stuff_name,
      stuff_variant,
      current_sell_price,
      has_sn,
      barcode,
    } = body;

    // ================= NORMALIZE =================
    if (typeof has_sn === "string") {
      has_sn = has_sn === "true" || has_sn === "1";
    }

    if (typeof current_sell_price === "string") {
      current_sell_price = convertionToNumber(current_sell_price);
    }

    if (typeof stuff_code === "string") stuff_code = stuff_code.trim();
    if (typeof stuff_sku === "string") stuff_sku = stuff_sku.trim();
    if (typeof stuff_name === "string") stuff_name = stuff_name.trim();
    if (typeof stuff_variant === "string") stuff_variant = stuff_variant.trim();
    if (typeof barcode === "string") barcode = barcode.trim();

    // ================= VALIDATION =================
    if (!stuff_category_id)
      return res
        .status(400)
        .json({ status: 400, message: "Missing stuff_category_id" });
    if (!stuff_brand_id)
      return res
        .status(400)
        .json({ status: 400, message: "Missing stuff_brand_id" });
    if (!supplier_id)
      return res
        .status(400)
        .json({ status: 400, message: "Missing supplier_id" });
    if (!stuff_code)
      return res
        .status(400)
        .json({ status: 400, message: "Missing stuff_code" });
    if (!stuff_sku)
      return res
        .status(400)
        .json({ status: 400, message: "Missing stuff_sku" });
    if (!stuff_name)
      return res
        .status(400)
        .json({ status: 400, message: "Missing stuff_name" });
    if (!stuff_variant)
      return res
        .status(400)
        .json({ status: 400, message: "Missing stuff_variant" });
    if (!current_sell_price)
      return res
        .status(400)
        .json({ status: 400, message: "Missing current_sell_price" });
    if (typeof has_sn !== "boolean")
      return res
        .status(400)
        .json({ status: 400, message: "Invalid has_sn value" });
    if (!barcode)
      return res.status(400).json({ status: 400, message: "Missing barcode" });

    await store.query("BEGIN");

    // ================= AUTH CONTEXT =================
    const employeeAccountId = req.user.id;

    const employeeQuery = await store.query(
      `
      SELECT employee.employee_id
      FROM employee
      JOIN employee_account
        ON employee_account.employee_id = employee.employee_id
      WHERE employee_account.employee_account_id = $1
      `,
      [employeeAccountId]
    );

    if (!employeeQuery.rows.length) {
      await store.query("ROLLBACK");
      return res
        .status(404)
        .json({ status: 404, message: "Employee not found" });
    }

    const employeeId = employeeQuery.rows[0].employee_id;

    // ================= INSERT =================
    const stuffQuery = await store.query(
      `
      INSERT INTO stuff 
      (stuff_category_id, stuff_brand_id, supplier_id, stuff_code, stuff_sku, stuff_name, stuff_variant, current_sell_price, has_sn, barcode)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
      `,
      [
        stuff_category_id,
        stuff_brand_id,
        supplier_id,
        stuff_code,
        stuff_sku,
        stuff_name,
        stuff_variant,
        current_sell_price,
        has_sn,
        barcode,
      ]
    );

    const stuffData = stuffQuery.rows[0];

    await store.query(
      `
      INSERT INTO stuff_history (stuff_id, employee_id, operation, new_data)
      VALUES ($1, $2, 'insert', $3)
      `,
      [stuffData.stuff_id, employeeId, stuffData]
    );

    await store.query("COMMIT");

    return res.status(201).json({
      status: 201,
      message: "Success add stuff",
      data: stuffData,
    });
  } catch (err) {
    await store.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/stuff-history", verifyToken, async (req, res) => {
  try {
    let query = await store.query(`
      SELECT
      employee.employee_id,
      stuff.stuff_id,
      employee.employee_name,
      stuff.stuff_name,
      operation,
      change_at,
      old_data,
      new_data
      FROM stuff_history
      LEFT JOIN employee ON employee.employee_id = stuff_history.employee_id
      LEFT JOIN stuff ON stuff.stuff_id = stuff_history.stuff_id
    `);
    let result = query.rows;

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/stuff/:stuff_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.stuff_id);

  try {
    let stuffQuery = await store.query(
      `
      SELECT 
      stuff.stuff_id,
      stuff_category.stuff_category_id,
      stuff_brand.stuff_brand_id,
      supplier.supplier_id,
      stuff.stuff_name,
      stuff_category.stuff_category_name,
      stuff_brand.stuff_brand_name,
      supplier.supplier_name,
      stuff.stuff_code,
      stuff.stuff_sku,
      stuff.stuff_variant,
      stuff.barcode,
      stuff.has_sn,
      stuff.current_sell_price
      FROM stuff
      LEFT JOIN stuff_category ON stuff_category.stuff_category_id = stuff.stuff_category_id
      LEFT JOIN stuff_brand ON stuff_brand.stuff_brand_id = stuff.stuff_brand_id
      LEFT JOIN supplier ON supplier.supplier_id = stuff.supplier_id
      WHERE stuff_id = $1   
    `,
      [reqId]
    );
    let stuffResult = stuffQuery.rows[0];

    let stuffCategoryQuery = await store.query(
      "SELECT stuff_category_id, stuff_category_name FROM stuff_category"
    );
    let resultStuffCategory = stuffCategoryQuery.rows;

    let stuffBrandQuery = await store.query(
      "SELECT stuff_brand_id, stuff_brand_name FROM stuff_brand"
    );
    let resultStuffBrand = stuffBrandQuery.rows;

    let supplierQuery = await store.query(
      "SELECT supplier_id, supplier_name FROM supplier"
    );
    let resultSupplier = supplierQuery.rows;

    if (stuffQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Stuff data not found",
      });
    }

    if (stuffCategoryQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Category data not found",
      });
    }

    if (stuffBrandQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Brand data not found",
      });
    }

    if (supplierQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Supplier data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: stuffResult,
      stuff_category: resultStuffCategory,
      stuff_brand: resultStuffBrand,
      suppleir: resultSupplier,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.patch("/stuff/:stuff_id", verifyToken, async (req, res) => {
  const stuffId = parseInt(req.params.stuff_id);

  if (!Number.isInteger(stuffId)) {
    return res.status(400).json({ status: 400, message: "Invalid stuff_id" });
  }

  const schema = {
    stuff_category_id: "number",
    stuff_brand_id: "number",
    supplier_id: "number",
    stuff_code: "string",
    stuff_sku: "string",
    stuff_name: "string",
    stuff_variant: "string",
    current_sell_price: "number",
    has_sn: "boolean",
    barcode: "string",
  };

  const clean = {};

  // ================= NORMALIZE & VALIDATE =================
  for (const key in schema) {
    if (req.body[key] !== undefined) {
      let value = req.body[key];

      if (schema[key] === "number") {
        value = convertionToNumber(value);
        if (!Number.isFinite(value)) {
          return res
            .status(400)
            .json({ status: 400, message: `Invalid ${key}` });
        }
      }

      if (schema[key] === "boolean") {
        if (typeof value === "string") {
          value = value === "true" || value === "1";
        }
        if (typeof value !== "boolean") {
          return res
            .status(400)
            .json({ status: 400, message: `Invalid ${key}` });
        }
      }

      if (schema[key] === "string") {
        value = String(value).trim();
        if (!value) {
          return res
            .status(400)
            .json({ status: 400, message: `Invalid ${key}` });
        }
      }

      clean[key] = value;
    }
  }

  if (!Object.keys(clean).length) {
    return res
      .status(400)
      .json({ status: 400, message: "No valid field to update" });
  }

  try {
    await store.query("BEGIN");

    // ================= CHECK STUFF EXISTENCE =================
    const oldDataQuery = await store.query(
      "SELECT * FROM stuff WHERE stuff_id = $1",
      [stuffId]
    );

    if (!oldDataQuery.rows.length) {
      await store.query("ROLLBACK");
      return res.status(404).json({ status: 404, message: "Stuff not found" });
    }

    const oldData = oldDataQuery.rows[0];

    // ================= AUTH CONTEXT =================
    const employeeAccountId = req.user.id;

    const employeeQuery = await store.query(
      `
      SELECT employee.employee_id
      FROM employee
      JOIN employee_account
        ON employee_account.employee_id = employee.employee_id
      WHERE employee_account.employee_account_id = $1
      `,
      [employeeAccountId]
    );

    if (!employeeQuery.rows.length) {
      await store.query("ROLLBACK");
      return res
        .status(404)
        .json({ status: 404, message: "Employee not found" });
    }

    const employeeId = employeeQuery.rows[0].employee_id;

    // ================= BUILD UPDATE QUERY =================
    const keys = Object.keys(clean);
    const values = Object.values(clean);

    const setQuery = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");

    const updateQuery = `
      UPDATE stuff
      SET ${setQuery}
      WHERE stuff_id = $${keys.length + 1}
      RETURNING *
    `;

    const newDataQuery = await store.query(updateQuery, [...values, stuffId]);
    const newData = newDataQuery.rows[0];

    // ================= HISTORY =================
    await store.query(
      `
      INSERT INTO stuff_history (stuff_id, employee_id, operation, old_data, new_data)
      VALUES ($1, $2, 'update', $3, $4)
      `,
      [stuffId, employeeId, oldData, newData]
    );

    await store.query("COMMIT");

    return res.status(200).json({
      status: 200,
      message: "Success updated data",
      data: newData,
    });
  } catch (err) {
    await store.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/stuff-purchases", verifyToken, async (req, res) => {
  try {
    const query = await store.query(`
      SELECT
        sp.stuff_purchase_id,
        s.supplier_name,
        e.employee_name,
        sp.buy_date,
        sp.total_price
      FROM stuff_purchase sp
      LEFT JOIN supplier s ON s.supplier_id = sp.supplier_id
      LEFT JOIN employee e ON e.employee_id = sp.employee_id
      ORDER BY sp.stuff_purchase_id DESC
    `);

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: query.rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get(
  "/stuff-purchase-detail/:stuff_purchase_id",
  verifyToken,
  async (req, res) => {
    const id = parseInt(req.params.stuff_purchase_id);

    try {
      const query = await store.query(
        `
        SELECT
          sp.stuff_purchase_id,
          s.supplier_name,
          e.employee_name,
          w.warehouse_name,
          st.stuff_name,
          spd.buy_batch,
          sp.buy_date,
          spd.quantity,
          spd.buy_price,
          sp.total_price
        FROM stuff_purchase sp
        LEFT JOIN supplier s ON s.supplier_id = sp.supplier_id
        LEFT JOIN employee e ON e.employee_id = sp.employee_id
        LEFT JOIN stuff_purchase_detail spd 
          ON spd.stuff_purchase_id = sp.stuff_purchase_id
        LEFT JOIN warehouse w ON w.warehouse_id = spd.warehouse_id
        LEFT JOIN stuff st ON st.stuff_id = spd.stuff_id
        WHERE sp.stuff_purchase_id = $1
      `,
        [id]
      );

      if (query.rows.length === 0) {
        return res.status(404).json({
          status: 404,
          message: "Data not found",
        });
      }

      return res.status(200).json({
        status: 200,
        data: query.rows[0],
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: 500,
        message: "Internal server error",
      });
    }
  }
);

app.get("/stuff-purchase", verifyToken, async (req, res) => {
  try {
    let supplierQuery = await store.query("SELECT * FROM supplier");
    let warehouseQuery = await store.query("SELECT * FROM warehouse");
    let stuffQuery = await store.query("SELECT * FROM stuff");

    let supplierResult = supplierQuery.rows;
    let warehouseResult = warehouseQuery.rows;
    let stuffResult = stuffQuery.rows;

    if (supplierQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Supplier data not found",
      });
    }

    if (warehouseQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Warehouse data not found",
      });
    }

    if (stuffQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Stuff data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: {
        supplier: supplierResult,
        warehouse: warehouseResult,
        stuff: stuffResult,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.post("/stuff-purchase", verifyToken, async (req, res) => {
  let {
    supplier_id,
    buy_date,
    total_price,
    warehouse_id,
    stuff_id,
    buy_batch,
    quantity,
    buy_price,
  } = req.body;

  // ===== VALIDATION =====
  if (!supplier_id || !buy_date || !total_price) {
    return res.status(400).json({
      status: 400,
      message: "supplier_id, buy_date, total_price are required",
    });
  }

  try {
    await store.query("BEGIN");

    // 👉 ambil employee dari token
    const accountId = req.user.id;

    const employeeQuery = await store.query(
      `
        SELECT employee_id
        FROM employee_account
        WHERE employee_account_id = $1
      `,
      [accountId]
    );

    if (employeeQuery.rows.length === 0) {
      throw new Error("Employee not found");
    }

    const employeeId = employeeQuery.rows[0].employee_id;

    const purchaseQuery = await store.query(
      `
      INSERT INTO stuff_purchase
      (supplier_id, employee_id, buy_date, total_price)
      VALUES ($1, $2, $3, $4)
      RETURNING stuff_purchase_id
    `,
      [supplier_id, employeeId, buy_date, total_price]
    );

    const purchaseId = purchaseQuery.rows[0].stuff_purchase_id;

    await store.query(
      `
      INSERT INTO stuff_purchase_detail
      (warehouse_id, stuff_id, stuff_purchase_id, buy_batch, quantity, buy_price)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [warehouse_id, stuff_id, purchaseId, buy_batch, quantity, buy_price]
    );

    await store.query("COMMIT");

    return res.status(201).json({
      status: 201,
      message: "Purchase created successfully",
    });
  } catch (err) {
    await store.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.post(
  "/upload-stuff-purchase",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
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
      } else if (ext === "xlsx" || ext === "xls") {
        rows = parseExcel(filePath);
      } else {
        throw new Error("File format must be csv or excel");
      }

      if (rows.length === 0) {
        throw new Error("Empty file or format is wrong");
      }

      await store.query("BEGIN");

      let refreshToken = req.cookies.refreshToken;
      let account = await new Promise((resolve, reject) => {
        jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET,
          (err, account) => {
            if (err) return reject(err);
            resolve(account);
          }
        );
      });

      let employeeQuery = await store.query(
        `
        SELECT employee.employee_id
        FROM employee
        JOIN employee_account
        ON employee_account.employee_id = employee.employee_id
        WHERE employee_account.employee_account_id = $1
    `,
        [account.id]
      );
      let employeeId = employeeQuery.rows[0].employee_id;

      for (let i = 0; i < rows.length; i++) {
        let item = rows[i];

        for (let key in item) {
          if (typeof item[key] === "string") {
            item[key] = item[key].toLowerCase().trim();
          }
        }

        let {
          supplier_name,
          buy_date,
          total_price,
          warehouse_name,
          stuff_name,
          buy_batch,
          quantity,
          buy_price,
        } = item;

        let supplierQuery = await store.query(
          "SELECT supplier_id FROM supplier WHERE LOWER (supplier_name) = $1",
          [supplier_name]
        );
        if (supplierQuery.rows.length === 0) {
          return res.status(404).json({
            status: 404,
            message: `${supplier_name} not registered`,
          });
        }
        let supplierId = supplierQuery.rows[0].supplier_id;

        let warehouseQuery = await store.query(
          "SELECT warehouse_id FROM warehouse WHERE LOWER (warehouse_name) = $1",
          [warehouse_name]
        );
        if (warehouseQuery.rows.length === 0) {
          return res.status(404).json({
            status: 404,
            message: `${warehouse_name} not registered`,
          });
        }
        let warehouseId = warehouseQuery.rows[0].warehouse_id;

        let stuffQuery = await store.query(
          "SELECT stuff_id FROM stuff WHERE LOWER (stuff_name) = $1",
          [stuff_name]
        );
        if (stuffQuery.rows.length === 0) {
          return res.status(404).json({
            status: 404,
            message: `${stuff_name} not registered`,
          });
        }
        let stuffId = stuffQuery.rows[0].stuff_id;

        let purchaseQuery = await store.query(
          "INSERT INTO stuff_purchase (supplier_id, employee_id, buy_date, total_price) VALUES ($1, $2, $3, $4) RETURNING stuff_purchase_id",
          [supplierId, employeeId, buy_date, total_price]
        );
        let purchaseId = purchaseQuery.rows[0].stuff_purchase_id;

        await store.query(
          "INSERT INTO stuff_purchase_detail (warehouse_id, stuff_id, stuff_purchase_id, buy_batch, quantity, buy_price) VALUES ($1, $2, $3, $4, $5, $6)",
          [warehouseId, stuffId, purchaseId, buy_batch, quantity, buy_price]
        );
        fs.unlinkSync(filePath);
      }

      await store.query("COMMIT");

      return res.status(201).json({
        status: 201,
        message: "Purchase success",
      });
    } catch (err) {
      await store.query("ROLLBACK");
      console.error(err);
      return res.status(500).json({
        status: 500,
        message: "Internal server",
      });
    }
  }
);

// CUSTOMER
app.get("/customers", verifyToken, async (req, res) => {
  try {
    let query = await store.query("SELECT * FROM customer");
    let result = query.rows;

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.post("/customer", verifyToken, async (req, res) => {
  let { customer_name, customer_contact, customer_address } = req.body;

  if (!customer_name) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: customer_name",
    });
  } else if (!customer_contact) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: customer_contact",
    });
  } else if (!customer_address) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: customer_address",
    });
  }

  if (typeof customer_name === "string") {
    customer_name = customer_name.trim();
  }

  if (typeof customer_contact === "string") {
    customer_contact = customer_contact.trim();
  }

  if (typeof customer_address === "string") {
    customer_address = customer_address.trim();
  }

  try {
    await store.query(
      "INSERT INTO customer (customer_name, customer_contact, customer_address) VALUES ($1, $2, $3)",
      [customer_name, customer_contact, customer_address]
    );

    return res.status(201).json({
      status: 201,
      message: "Success add customer",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/customer/:customer_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.customer_id);

  try {
    let query = await store.query(
      "SELECT * FROM customer WHERE customer_id = $1",
      [reqId]
    );
    let result = query.rows[0];

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.patch("/customer/:customer_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.customer_id);
  let update = req.body;
  let keys = Object.keys(update);
  let fields = ["customer_name", "customer_contact", "customer_address"];
  let invalidField = keys.filter((k) => !fields.includes(k));

  if (invalidField.length > 0) {
    return res.status(400).json({
      status: 400,
      message: "Invalid field ",
      invalidField,
    });
  }

  if (keys.length === 0) {
    return res.status(400).json({
      status: 400,
      message: "No item updated",
    });
  }

  for (let k of keys) {
    if (typeof k === "string") {
      update[k] = update[k].trim();
    }
  }

  let setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(",");
  let values = Object.values(update);

  try {
    await store.query(
      `UPDATE customer SET ${setQuery} WHERE customer_id = $${keys.length + 1}`,
      [...values, reqId]
    );

    return res.status(200).json({
      status: 200,
      message: "Success updated data",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

// PAYMENT METHODE
app.get("/payment-methods", verifyToken, async (req, res) => {
  try {
    let query = await store.query("SELECT * FROM payment_method");
    let result = query.rows;

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.post("/payment-method", verifyToken, async (req, res) => {
  let { payment_method_name } = req.body;

  if (!payment_method_name) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: payment_method_name",
    });
  }

  if (typeof payment_method_name === "string") {
    payment_method_name = payment_method_name.trim();
  }

  try {
    await store.query(
      "INSERT INTO payment_method (payment_method_name) VALUES ($1)",
      [payment_method_name]
    );

    return res.status(201).json({
      status: 201,
      message: "Success add payment method",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/payment-method/:payment_method_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.payment_method_id);

  try {
    let query = await store.query(
      "SELECT * FROM payment_method WHERE payment_method_id = $1",
      [reqId]
    );
    let result = query.rows[0];

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.patch(
  "/payment-method/:payment_method_id",
  verifyToken,
  async (req, res) => {
    let reqId = parseInt(req.params.payment_method_id);
    let update = req.body;
    let keys = Object.keys(update);
    let fields = ["payment_method_name"];
    let invalidField = keys.filter((k) => !fields.includes(k));

    if (invalidField.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Invalid field ",
        invalidField,
      });
    }

    if (keys.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "No item updated",
      });
    }

    for (let k of keys) {
      if (typeof k === "string") {
        update[k] = update[k].trim();
      }
    }

    let setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(",");
    let values = Object.values(update);

    try {
      await store.query(
        `UPDATE payment_method SET ${setQuery} WHERE payment_method_id = $${
          keys.length + 1
        }`,
        [...values, reqId]
      );

      return res.status(200).json({
        status: 200,
        message: "Success updated data",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: 500,
        message: "Internal server error",
      });
    }
  }
);

// DISCOUNT
app.get("/stuff-discounts", verifyToken, async (req, res) => {
  try {
    let query = await store.query(`
      SELECT
      stuff.stuff_id,
      stuff_name,
      json_agg(
        DISTINCT jsonb_build_object(
          'discount_id', discount.discount_id,
          'employee_id', employee.employee_id,
          'employee_name', employee_name,
          'discount_name', discount_name,
          'discount_type', discount_type,
          'discount_value', discount_value,
          'started_time', started_time,
          'ended_time', ended_time,
          'discount_status', discount_status
        )
      ) AS stuff_discounts
      FROM stuff_discount
      LEFT JOIN stuff ON stuff_discount.stuff_id = stuff.stuff_id
      LEFT JOIN discount ON stuff_discount.discount_id = discount.discount_id
      LEFT JOIN employee ON employee.employee_id = discount.employee_id
      GROUP BY stuff.stuff_id, stuff_name
    `);
    let result = query.rows;

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/stuff-discount", verifyToken, async (req, res) => {
  try {
    let query = await store.query("SELECT * FROM stuff");
    let result = query.rows;

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Stuff data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: { stuff: result },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.post("/stuff-discount", verifyToken, async (req, res) => {
  let {
    stuff_id,
    discount_name,
    discount_type,
    discount_value,
    discount_start,
    discount_end,
    discount_status,
  } = req.body;

  if (!stuff_id || !discount_name || !discount_type || !discount_value) {
    return res.status(400).json({
      status: 400,
      message: "Missing required fields",
    });
  }

  if (typeof discount_type === "string") {
    discount_type = discount_type.toLowerCase().trim();
  }

  if (typeof discount_value === "string") {
    discount_value =
      discount_type === "percentage"
        ? convertionToDecimal(discount_value)
        : convertionToNumber(discount_value);
  }

  try {
    await store.query("BEGIN");

    // 🔑 AMBIL USER DARI ACCESS TOKEN
    const account = req.user;

    const employeeQuery = await store.query(
      `
        SELECT employee_id
        FROM employee_account
        WHERE employee_account_id = $1
      `,
      [account.id]
    );

    if (employeeQuery.rows.length === 0) {
      throw new Error("Employee not found");
    }

    const employeeId = employeeQuery.rows[0].employee_id;

    const discountQuery = await store.query(
      `
      INSERT INTO discount
      (employee_id, discount_name, discount_type, discount_value, started_time, ended_time, discount_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING discount_id
    `,
      [
        employeeId,
        discount_name,
        discount_type,
        discount_value,
        discount_start,
        discount_end,
        discount_status,
      ]
    );

    const discountId = discountQuery.rows[0].discount_id;

    await store.query(
      "INSERT INTO stuff_discount (stuff_id, discount_id) VALUES ($1, $2)",
      [stuff_id, discountId]
    );

    await store.query("COMMIT");

    return res.status(201).json({
      status: 201,
      message: "Success add stuff discount",
    });
  } catch (err) {
    await store.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/stuff-discount/:stuff_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.stuff_id);

  try {
    let query = await store.query(
      `
      SELECT
      stuff.stuff_id,
      stuff_name,
      json_agg(
        DISTINCT jsonb_build_object(
          'discount_id', discount.discount_id,
          'employee_id', employee.employee_id,
          'employee_name', employee_name,
          'discount_name', discount_name,
          'discount_type', discount_type,
          'discount_value', discount_value,
          'started_time', started_time,
          'ended_time', ended_time,
          'discount_status', discount_status
        )
      ) AS stuff_discounts
      FROM stuff_discount
      LEFT JOIN stuff ON stuff_discount.stuff_id = stuff.stuff_id
      LEFT JOIN discount ON stuff_discount.discount_id = discount.discount_id
      LEFT JOIN employee ON employee.employee_id = discount.employee_id
      WHERE stuff.stuff_id = $1
      GROUP BY stuff.stuff_id, stuff.stuff_name
    `,
      [reqId]
    );
    let stuffQuery = await store.query("SELECT * FROM stuff");

    let result = query.rows[0];
    let stuffResult = stuffQuery.rows;

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    if (stuffQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Stuff data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: { stuff_discount: result, stuff: stuffResult },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.patch("/stuff-discount/:discount_id", verifyToken, async (req, res) => {
  const discountId = parseInt(req.params.discount_id);
  const body = req.body;

  const discountFields = [
    "discount_name",
    "discount_type",
    "discount_value",
    "discount_start",
    "discount_end",
    "discount_status",
  ];

  const stuffDiscountFields = ["stuff_id"];

  const discountUpdate = {};
  const stuffDiscountUpdate = {};

  // ================= FILTER FIELD =================
  for (const key of discountFields) {
    if (body[key] !== undefined) {
      discountUpdate[key] = body[key];
    }
  }

  for (const key of stuffDiscountFields) {
    if (body[key] !== undefined) {
      stuffDiscountUpdate[key] = body[key];
    }
  }

  // ================= NORMALIZATION =================
  if (typeof discountUpdate.discount_type === "string") {
    discountUpdate.discount_type = discountUpdate.discount_type
      .toLowerCase()
      .trim();
  }

  if (typeof discountUpdate.discount_name === "string") {
    discountUpdate.discount_name = discountUpdate.discount_name.trim();
  }

  if (typeof discountUpdate.discount_start === "string") {
    discountUpdate.discount_start = discountUpdate.discount_start.trim();
  }

  if (typeof discountUpdate.discount_end === "string") {
    discountUpdate.discount_end = discountUpdate.discount_end.trim();
  }

  if (typeof discountUpdate.discount_value === "string") {
    if (discountUpdate.discount_type === "percentage") {
      discountUpdate.discount_value = convertionToDecimal(
        discountUpdate.discount_value
      );
    } else if (discountUpdate.discount_type === "fixed") {
      discountUpdate.discount_value = convertionToNumber(
        discountUpdate.discount_value
      );
    }
  }

  try {
    await store.query("BEGIN");

    // 🔐 AMBIL USER DARI ACCESS TOKEN
    const account = req.user;

    const employeeQuery = await store.query(
      `
        SELECT employee_id
        FROM employee_account
        WHERE employee_account_id = $1
      `,
      [account.id]
    );

    if (employeeQuery.rows.length === 0) {
      throw new Error("Employee not found");
    }

    const employeeId = employeeQuery.rows[0].employee_id;

    // ================= UPDATE DISCOUNT =================
    if (Object.keys(discountUpdate).length > 0) {
      const fields = Object.keys(discountUpdate);
      const values = Object.values(discountUpdate);

      const setQuery = fields.map((key, i) => `${key} = $${i + 1}`).join(", ");

      await store.query(
        `
        UPDATE discount
        SET ${setQuery}, employee_id = $${values.length + 1}
        WHERE discount_id = $${values.length + 2}
      `,
        [...values, employeeId, discountId]
      );
    }

    // ================= UPDATE STUFF_DISCOUNT =================
    if (Object.keys(stuffDiscountUpdate).length > 0) {
      const fields = Object.keys(stuffDiscountUpdate);
      const values = Object.values(stuffDiscountUpdate);

      const setQuery = fields.map((key, i) => `${key} = $${i + 1}`).join(", ");

      await store.query(
        `
        UPDATE stuff_discount
        SET ${setQuery}
        WHERE discount_id = $${values.length + 1}
      `,
        [...values, discountId]
      );
    }

    await store.query("COMMIT");

    return res.status(200).json({
      status: 200,
      message: "Success updated stuff discount",
    });
  } catch (err) {
    await store.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/order-discounts", verifyToken, async (req, res) => {
  try {
    let query = await store.query(`
      SELECT
      discount.discount_id,
      employee.employee_id,
      employee_name,
      discount_name,
      discount_type,
      discount_value,
      started_time,
      ended_time,
      discount_status
      FROM discount
      LEFT JOIN employee ON employee.employee_id = discount.employee_id  
    `);
    let result = query.rows;

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.post("/order-discount", verifyToken, async (req, res) => {
  let {
    discount_name,
    discount_type,
    discount_value,
    discount_start,
    discount_end,
    discount_status,
  } = req.body;

  // =========================
  // VALIDATION
  // =========================
  if (!discount_name)
    return res
      .status(400)
      .json({ status: 400, message: "Missing required key: discount_name" });

  if (!discount_type)
    return res
      .status(400)
      .json({ status: 400, message: "Missing required key: discount_type" });

  if (discount_value === undefined)
    return res
      .status(400)
      .json({ status: 400, message: "Missing required key: discount_value" });

  if (!discount_start)
    return res
      .status(400)
      .json({ status: 400, message: "Missing required key: discount_start" });

  if (!discount_end)
    return res
      .status(400)
      .json({ status: 400, message: "Missing required key: discount_end" });

  if (!discount_status)
    return res
      .status(400)
      .json({ status: 400, message: "Missing required key: discount_status" });

  // =========================
  // NORMALIZATION
  // =========================
  if (typeof discount_type === "string")
    discount_type = discount_type.toLowerCase().trim();

  if (typeof discount_name === "string") discount_name = discount_name.trim();

  if (typeof discount_start === "string")
    discount_start = discount_start.trim();

  if (typeof discount_end === "string") discount_end = discount_end.trim();

  if (typeof discount_value === "string") {
    if (discount_type === "percentage") {
      discount_value = convertionToDecimal(discount_value);
    } else if (discount_type === "fixed") {
      discount_value = convertionToNumber(discount_value);
    }
  }

  try {
    // =========================
    // GET EMPLOYEE FROM ACCESS TOKEN
    // =========================
    const employeeQuery = await store.query(
      `
        SELECT e.employee_id
        FROM employee e
        JOIN employee_account ea
          ON ea.employee_id = e.employee_id
        WHERE ea.employee_account_id = $1
      `,
      [req.user.id]
    );

    if (employeeQuery.rows.length === 0) {
      return res.status(403).json({
        status: 403,
        message: "Employee not found",
      });
    }

    const employeeId = employeeQuery.rows[0].employee_id;

    // =========================
    // INSERT DISCOUNT
    // =========================
    await store.query(
      `
        INSERT INTO discount
          (employee_id, discount_name, discount_type, discount_value, started_time, ended_time, discount_status)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        employeeId,
        discount_name,
        discount_type,
        discount_value,
        discount_start, // → started_time
        discount_end, // → ended_time
        discount_status,
      ]
    );

    return res.status(201).json({
      status: 201,
      message: "Success add discount",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/order-discount/:discount_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.discount_id);

  try {
    let query = await store.query(
      `
      SELECT
      discount.discount_id,
      employee.employee_id,
      employee_name,
      discount_name,
      discount_type,
      discount_value,
      started_time,
      ended_time,
      discount_status
      FROM discount
      LEFT JOIN employee ON employee.employee_id = discount.employee_id
      WHERE discount_id = $1  
    `,
      [reqId]
    );
    let result = query.rows[0];

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.patch("/stuff-discount/:discount_id", verifyToken, async (req, res) => {
  const discountId = parseInt(req.params.discount_id);
  const body = req.body;

  const discountFields = [
    "discount_name",
    "discount_type",
    "discount_value",
    "started_time", // ✅ FIX
    "ended_time", // ✅ FIX
    "discount_status",
  ];

  const stuffDiscountFields = ["stuff_id"];

  const discountUpdate = {};
  const stuffDiscountUpdate = {};

  for (const key of discountFields) {
    if (body[key] !== undefined) {
      discountUpdate[key] = body[key];
    }
  }

  for (const key of stuffDiscountFields) {
    if (body[key] !== undefined) {
      stuffDiscountUpdate[key] = body[key];
    }
  }

  if (typeof discountUpdate.discount_type === "string") {
    discountUpdate.discount_type = discountUpdate.discount_type
      .toLowerCase()
      .trim();
  }

  if (typeof discountUpdate.discount_name === "string") {
    discountUpdate.discount_name = discountUpdate.discount_name.trim();
  }

  if (typeof discountUpdate.started_time === "string") {
    discountUpdate.started_time = discountUpdate.started_time.trim();
  }

  if (typeof discountUpdate.ended_time === "string") {
    discountUpdate.ended_time = discountUpdate.ended_time.trim();
  }

  if (typeof discountUpdate.discount_value === "string") {
    if (discountUpdate.discount_type === "percentage") {
      discountUpdate.discount_value = convertionToDecimal(
        discountUpdate.discount_value
      );
    } else if (discountUpdate.discount_type === "fixed") {
      discountUpdate.discount_value = convertionToNumber(
        discountUpdate.discount_value
      );
    }
  }

  try {
    await store.query("BEGIN");

    const account = req.user;

    const employeeQuery = await store.query(
      `
      SELECT employee_id
      FROM employee_account
      WHERE employee_account_id = $1
      `,
      [account.id]
    );

    const employeeId = employeeQuery.rows[0].employee_id;

    // ===== UPDATE DISCOUNT =====
    if (Object.keys(discountUpdate).length > 0) {
      const fields = Object.keys(discountUpdate);
      const values = Object.values(discountUpdate);

      const setQuery = fields.map((key, i) => `${key} = $${i + 1}`).join(", ");

      await store.query(
        `
        UPDATE discount
        SET ${setQuery}, employee_id = $${values.length + 1}
        WHERE discount_id = $${values.length + 2}
        `,
        [...values, employeeId, discountId]
      );
    }

    // ===== UPDATE STUFF_DISCOUNT =====
    if (Object.keys(stuffDiscountUpdate).length > 0) {
      const fields = Object.keys(stuffDiscountUpdate);
      const values = Object.values(stuffDiscountUpdate);

      const setQuery = fields.map((key, i) => `${key} = $${i + 1}`).join(", ");

      await store.query(
        `
        UPDATE stuff_discount
        SET ${setQuery}
        WHERE discount_id = $${values.length + 1}
        `,
        [...values, discountId]
      );
    }

    await store.query("COMMIT");

    return res.status(200).json({
      status: 200,
      message: "Success updated stuff discount",
    });
  } catch (err) {
    await store.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

// ACCOUNT
app.get("/employee-accounts", verifyToken, async (req, res) => {
  try {
    let query = await store.query(`
      SELECT
      employee_account.employee_account_id,
      employee.employee_id,
      employee_name,
      username,
      password,
      role,
      account_status
      FROM employee_account
      LEFT JOIN employee ON employee.employee_id = employee_account.employee_id
    `);
    let result = query.rows;

    if (result.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/employee-account", verifyToken, async (req, res) => {
  try {
    let query = await store.query("SELECT * FROM employee");
    let result = query.rows;

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: { employee: result },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.post("/register", verifyToken, async (req, res) => {
  let { employee_id, username, password, role, account_status } = req.body;

  if (!employee_id) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: employee_id",
    });
  } else if (!username) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: username",
    });
  } else if (!password) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: password",
    });
  } else if (!role) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: role",
    });
  } else if (!account_status) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: account_status",
    });
  }

  if (typeof account_status === "string") {
    account_status = account_status.toLowerCase().trim();
  }

  if (typeof username === "string") {
    username = username.trim();
  }

  if (typeof password === "string") {
    password = password.trim();
  }

  if (typeof role === "string") {
    role = role.trim();
  }

  try {
    const checkResult = await store.query(
      "SELECT * FROM employee_account WHERE username = $1",
      [username]
    );

    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        status: 409,
        message: "Username already used",
      });
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password : ", err);
        } else {
          await store.query(
            "INSERT INTO employee_account (employee_id, username, password, role, account_status) VALUES ($1, $2, $3, $4, $5)",
            [employee_id, username, hash, role, account_status]
          );

          return res.status(201).json({
            status: 201,
            message: "Register account success",
          });
        }
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.post("/login", async (req, res) => {
  let { username, password } = req.body;
  const accountQuery = await store.query(
    "SELECT * FROM employee_account WHERE username = $1",
    [username]
  );

  try {
    if (accountQuery.rows.length > 0) {
      const account = accountQuery.rows[0];
      const hashPassword = account.password;

      if (!account) {
        return res.status(401).json({
          status: 401,
          message: "Invalid credentials",
        });
      }

      if (accountQuery.rows[0].account_status === "non-active") {
        return res.status(401).json({
          status: 401,
          message: "You can't access this account anymore",
        });
      }

      bcrypt.compare(password, hashPassword, async (err, valid) => {
        if (err) {
          return console.error("Error comparing password: ", err);
        }
        if (valid) {
          let accessToken = generateAccessToken(account);
          let refreshToken = generateRefreshToken(account);
          let expiresAt = new Date();

          expiresAt.setDate(expiresAt.getDate() + 7);

          await store.query(
            "INSERT INTO refresh_token (employee_account_id, token, expires_at) VALUES ($1, $2, $3)",
            [account.employee_account_id, refreshToken, expiresAt]
          );

          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });

          return res.status(200).json({
            status: 200,
            access_token: accessToken,
          });
        } else {
          return res.status(400).json({
            status: 400,
            message: "Username or password doesn't match",
          });
        }
      });
    } else {
      console.log("Account not found");
      return res.status(400).json({
        status: 400,
        message: "Account not found",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/employee-account/:account_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.account_id);

  try {
    let query = await store.query(
      `
      SELECT
      employee_account.employee_account_id,
      employee.employee_id,
      employee_name,
      username,
      password,
      role,
      account_status
      FROM employee_account
      LEFT JOIN employee ON employee.employee_id = employee_account.employee_id
      WHERE employee_account.employee_account_id = $1
    `,
      [reqId]
    );
    let result = query.rows[0];

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.patch(
  "/employee-account/:employee_account_id",
  verifyToken,
  async (req, res) => {
    let reqId = parseInt(req.params.employee_account_id);
    let update = req.body;
    let keys = Object.keys(update);
    let fields = {
      employee_id: "number",
      username: "string",
      password: "string",
      role: "string",
      account_status: "string",
    };
    let invalidField = keys.filter((k) => !fields[k]);

    if (invalidField.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Invalid field ",
        invalidField,
      });
    }

    if (keys.length === 0) {
      return res.status("400").json({
        status: 400,
        message: "No item updated",
      });
    }

    for (let key of keys) {
      let expextedType = fields[key];
      let value = update[key];

      if (expextedType === "string") {
        update[key] = value.trim();
      }

      if (expextedType === "number") {
        update[key] = convertionToNumber(value);
      }

      if (key === "password") {
        update[key] = await bcrypt.hash(value, saltRounds);
      }
    }

    let setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(",");
    let values = Object.values(update);

    try {
      await store.query(
        `UPDATE employee_account SET ${setQuery} WHERE employee_account_id = $${
          keys.length + 1
        }`,
        [...values, reqId]
      );

      return res.status(200).json({
        status: 200,
        message: "Success updated data",
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: 500,
        message: "Internal server error",
      });
    }
  }
);

app.post("/refresh-token", async (req, res) => {
  try {
    let refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        status: 401,
        message: "No refresh token provided",
      });
    }

    let query = await store.query(
      "SELECT * FROM refresh_token WHERE token = $1",
      [refreshToken]
    );
    let queryToken = query.rows[0];

    if (!queryToken) {
      return res.status(401).json({
        status: 401,
        message: "Invalid refresh token",
      });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, account) => {
      if (err) {
        return res.status(401).json({
          status: 401,
          message: "Token is no longer valid",
        });
      }

      let newAccessToken = generateAccessToken(account);

      res.status(200).json({
        status: 200,
        access_token: newAccessToken,
      });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.post("/logout", verifyToken, async (req, res) => {
  try {
    let refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await store.query("DELETE from refresh_token WHERE token = $1", [
        refreshToken,
      ]);
      res.clearCookie("refreshToken");
    }

    return res.status(200).json({
      status: 200,
      message: "Logout successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

// STOCK
app.get("/stocks", verifyToken, async (req, res) => {
  try {
    const query = await store.query(`
      SELECT
        w.warehouse_id,
        s.stuff_id,
        w.warehouse_name,
        s.stuff_name,
        COUNT(si.stuff_information_id) AS total_stock
      FROM stock st
      JOIN warehouse w ON w.warehouse_id = st.warehouse_id
      JOIN stuff s ON s.stuff_id = st.stuff_id
      JOIN stuff_information si ON si.stuff_information_id = st.stuff_information_id
      WHERE si.stock_status = 'ready'
      GROUP BY w.warehouse_id, s.stuff_id, w.warehouse_name, s.stuff_name
      ORDER BY w.warehouse_name, s.stuff_name
    `);

    if (query.rows.length === 0) {
      return res.status(404).json({ status: 404, message: "Data not found" });
    }

    return res.status(200).json({ status: 200, data: query.rows });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ status: 500, message: "Internal server error" });
  }
});

app.get("/stock-history", verifyToken, async (req, res) => {
  try {
    let query = await store.query(`
      SELECT
      stock.stock_id,
      warehouse.warehouse_id,
      stuff.stuff_id,
      stuff_information.stuff_information_id,
      warehouse_name,
      stuff_name,
      imei_1,
      imei_2,
      sn,
      stock_date,
      stock_type,
      stock_status
      FROM stock
      LEFT JOIN warehouse ON warehouse.warehouse_id = stock.warehouse_id
      LEFT JOIN stuff ON stuff.stuff_id = stock.stuff_id
      LEFT JOIN stuff_information ON stuff_information.stuff_information_id = stock.stuff_information_id  
    `);
    let result = query.rows;

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/stock", verifyToken, async (req, res) => {
  try {
    let stuffQuery = await store.query("SELECT * FROM stuff");
    let warehouseQuery = await store.query("SELECT * FROM warehouse");

    let stuffResult = stuffQuery.rows;
    let warehouseResult = warehouseQuery.rows;

    if (stuffQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Stuff data not found",
      });
    }

    if (warehouseQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Warehouse data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: { stuff: stuffResult, warehouse: warehouseResult },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});
// STOCK POST
app.post("/stock", verifyToken, async (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ status: 400, message: "Request body empty" });
  }

  let { warehouse_id, stuff_id, imei_1, imei_2, sn } = req.body;

  if (!warehouse_id)
    return res
      .status(400)
      .json({ status: 400, message: "Missing warehouse_id" });
  if (!stuff_id)
    return res.status(400).json({ status: 400, message: "Missing stuff_id" });
  if (!imei_1)
    return res.status(400).json({ status: 400, message: "Missing imei_1" });
  if (!imei_2)
    return res.status(400).json({ status: 400, message: "Missing imei_2" });
  if (!sn) return res.status(400).json({ status: 400, message: "Missing sn" });

  // Trim
  imei_1 = imei_1.toString().trim();
  imei_2 = imei_2.toString().trim();
  sn = sn.toString().trim();

  try {
    await store.query("BEGIN");

    // Insert into stuff_information
    let stuffInfoQuery = await store.query(
      `INSERT INTO stuff_information (stuff_id, imei_1, imei_2, sn, stock_status)
       VALUES ($1, $2, $3, $4, 'ready')
       RETURNING stuff_information_id`,
      [stuff_id, imei_1, imei_2, sn]
    );

    let stuffInfoId = stuffInfoQuery.rows[0].stuff_information_id;

    // Insert into stock
    await store.query(
      `INSERT INTO stock (warehouse_id, stuff_id, stuff_information_id, stock_type)
       VALUES ($1, $2, $3, 'in')`,
      [warehouse_id, stuff_id, stuffInfoId]
    );

    // Update total_stock
    await store.query(
      `UPDATE stuff
       SET total_stock = (SELECT COUNT(*) FROM stuff_information WHERE stuff_id = $1 AND stock_status = 'ready')
       WHERE stuff_id = $2`,
      [stuff_id, stuff_id]
    );

    await store.query("COMMIT");

    return res
      .status(201)
      .json({ status: 201, message: "Stock added successfully" });
  } catch (err) {
    await store.query("ROLLBACK");
    console.error(err);

    // Handle duplicate IMEI
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ status: 409, message: "IMEI already exists" });
    }

    return res
      .status(500)
      .json({ status: 500, message: "Internal server error" });
  }
});

app.post(
  "/upload-stock",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        status: 400,
        message: "File not found",
      });
    }

    let filePath = req.file.path;
    let ext = req.file.originalname.split(".").pop().toLowerCase();
    let rows = [];

    try {
      if (ext === "csv") {
        rows = await parseCSV(filePath);
      } else if (ext === "xlsx" || ext === "xls") {
        rows = parseExcel(filePath);
      } else {
        throw new Error("File format must be csv or excel");
      }

      if (rows.length === 0) {
        throw new Error("Empty file or format is wrong");
      }

      await store.query("BEGIN");

      for (let i = 0; i < rows.length; i++) {
        let item = rows[i];

        for (let key in item) {
          if (typeof item[key] === "string") {
            item[key] = item[key].toLowerCase().trim();
          }
        }

        let { warehouse_name, stuff_name, imei_1, imei_2, sn } = item;

        let warehouseQuery = await store.query(
          "SELECT warehouse_id FROM warehouse WHERE LOWER (warehouse_name) = $1",
          [warehouse_name]
        );
        if (warehouseQuery.rows.length === 0) {
          return res.status(404).json({
            status: 404,
            message: `${warehouse_name} not registered`,
          });
        }
        let warehouseId = warehouseQuery.rows[0].warehouse_id;

        let stuffQuery = await store.query(
          "SELECT stuff_id FROM stuff WHERE LOWER (stuff_name) = $1",
          [stuff_name]
        );
        if (stuffQuery.rows.length === 0) {
          return res.status(404).json({
            status: 404,
            message: `${stuff_name} not registered`,
          });
        }
        let stuffId = stuffQuery.rows[0].stuff_id;

        let stuffInfoQuery = await store.query(
          "INSERT INTO stuff_information (stuff_id, imei_1, imei_2, sn, stock_status) VALUES ($1, $2, $3, $4, 'ready') RETURNING stuff_information_id",
          [stuffId, imei_1, imei_2, sn]
        );
        let stuffInfoId = stuffInfoQuery.rows[0].stuff_information_id;

        await store.query(
          "INSERT INTO stock (warehouse_id, stuff_id, stuff_information_id, stock_type) VALUES ($1, $2, $3, 'in')",
          [warehouseId, stuffId, stuffInfoId]
        );
        await store.query(
          "UPDATE stuff SET total_stock = (SELECT COUNT(*) FROM stuff_information WHERE stuff_id = $1 AND stock_status = 'ready') WHERE stuff_id = $2",
          [stuffId, stuffId]
        );

        fs.unlinkSync(filePath);
      }

      await store.query("COMMIT");
      return res.status(201).json({
        status: 201,
        message: "Success updated stock",
      });
    } catch (err) {
      await store.query("ROLLBACK");
      console.error(err);
      return res.status(500).json({
        status: 500,
        message: "Internal server error",
      });
    }
  }
);

// CUSTOMER ORDER
app.get("/customer-orders", verifyToken, async (req, res) => {
  try {
    let query = await store.query(`
      SELECT
      customer_order.order_id,
      customer.customer_id,
      payment_method.payment_method_id,
      employee.employee_id,
      customer_name,
      payment_method_name,
      employee_name,
      order_date,
      payment,
      sub_total,
      remaining_payment
      FROM customer_order
      LEFT JOIN customer ON customer.customer_id = customer_order.customer_id
      LEFT JOIN payment_method ON payment_method.payment_method_id = customer_order.payment_method_id
      LEFT JOIN employee ON employee.employee_id = customer_order.employee_id
    `);
    let result = query.rows;

    if (query.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/customer-order-detail/:order_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.order_id);

  try {
    let orderQuery = await store.query(
      `
      SELECT
      customer_order.order_id,
      customer_order.order_date,
      employee.employee_id,
      employee.employee_name,
      customer.customer_id,
      customer.customer_name,
      customer.customer_contact,
      customer.customer_address,
      payment_method.payment_method_name,
      json_agg(
          DISTINCT jsonb_build_object(
              'stuff_id', stuff.stuff_id,
              'stuff_name', stuff.stuff_name,
              'category_name', stuff_category.stuff_category_name,
              'brand_name', stuff_brand.stuff_brand_name,
              'stuff_code', stuff.stuff_code,
              'stuff_sku', stuff.stuff_sku,
              'stuff_variant', stuff.stuff_variant,
              'barcode', stuff.barcode,
              'imei_1', customer_order_detail.imei_1,
              'imei_2', customer_order_detail.imei_2,
              'sn', customer_order_detail.sn,
              'stuff_discounts',
              (
                  SELECT json_agg(
                      jsonb_build_object(
                          'discount_id', discount.discount_id,
                          'discount_name', discount.discount_name,
                          'discount_type', discount.discount_type,
                          'discount_status', discount.discount_status,
                          'discount_value', discount.discount_value
                      )
                  )
                  FROM stuff_discount
                  JOIN discount ON discount.discount_id = stuff_discount.discount_id
                  WHERE stuff_discount.stuff_id = stuff.stuff_id
              )
          )
      ) AS stuff_order,
      (
          SELECT json_agg(
              DISTINCT jsonb_build_object(
          'discount_id', discount.discount_id,
                  'discount_name', discount.discount_name,
                  'discount_type', discount.discount_type,
                  'discount_status', discount.discount_status,
                  'discount_value', discount.discount_value
              )
          )
          FROM order_discount
          JOIN discount ON discount.discount_id = order_discount.discount_id
          WHERE order_discount.order_id = customer_order.order_id
      ) AS order_discounts,
      customer_order_detail.total_item_discount,
      customer_order_detail.total_order_discount,
      customer_order.payment,
      customer_order.sub_total,
      customer_order.remaining_payment
  FROM customer_order
  LEFT JOIN customer ON customer.customer_id = customer_order.customer_id
  LEFT JOIN payment_method ON payment_method.payment_method_id = customer_order.payment_method_id
  LEFT JOIN employee ON employee.employee_id = customer_order.employee_id
  LEFT JOIN customer_order_detail ON customer_order_detail.order_id = customer_order.order_id
  LEFT JOIN stuff ON stuff.stuff_id = customer_order_detail.stuff_id
  LEFT JOIN warehouse ON warehouse.warehouse_id = customer_order_detail.warehouse_id
  LEFT JOIN stuff_category ON stuff.stuff_category_id = stuff_category.stuff_category_id
  LEFT JOIN stuff_brand ON stuff.stuff_brand_id = stuff_brand.stuff_brand_id
  WHERE customer_order.order_id = $1
  GROUP BY
      customer_order.order_id,
      employee.employee_id,
      employee.employee_name,
      customer.customer_id,
      customer.customer_name,
      customer.customer_contact,
      customer.customer_address,
      payment_method.payment_method_name,
      customer_order.order_date,
      customer_order_detail.total_item_discount,
      customer_order_detail.total_order_discount,
      customer_order.payment,
      customer_order.sub_total,
      customer_order.remaining_payment
    `,
      [reqId]
    );
    let order = orderQuery.rows[0];

    if (orderQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Data not found",
      });
    }

    return res.status(200).json({
      status: 200,
      data: order,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.get("/customer-order", verifyToken, async (req, res) => {
  try {
    let customerQuery = await store.query("SELECT * FROM customer");
    let warehouseQuery = await store.query("SELECT * FROM warehouse");
    let paymentMethodQuery = await store.query("SELECT * FROM payment_method");
    let stuffQuery = await store.query("SELECT * FROM stuff");
    let orderDiscountQuery = await store.query("SELECT * FROM discount");

    if (customerQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Customer data not found",
      });
    }

    if (warehouseQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Warehouse data not found",
      });
    }

    if (paymentMethodQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Payment method data not found",
      });
    }

    if (stuffQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Stuff data not found",
      });
    }

    if (orderDiscountQuery.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Discount data not found",
      });
    }

    let customerResult = customerQuery.rows;
    let warehouseResult = warehouseQuery.rows;
    let paymentMethodResult = paymentMethodQuery.rows;
    let stuffResult = stuffQuery.rows;
    let orderDiscountResult = orderDiscountQuery.rows;

    return res.status(200).json({
      status: 200,
      data: {
        customer: customerResult,
        warehouse: warehouseResult,
        stuff: stuffResult,
        payment_method: paymentMethodResult,
        order_discount: orderDiscountResult,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.post("/customer-order", verifyToken, async (req, res) => {
  let {
    customer_id,
    warehouse_id,
    payment_method_id,
    order_date,
    payment,
    items,
    discounts,
  } = req.body;

  const account = req.user || req.account;

  if (!account || !account.id) {
    return res.status(401).json({
      status: 401,
      message: "Unauthorized: invalid token payload",
    });
  }

  if (!customer_id) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: customer_id",
    });
  } else if (!warehouse_id) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: warehouse_id",
    });
  } else if (!payment_method_id) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: payment_method_id",
    });
  } else if (!order_date) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: order_date",
    });
  } else if (!payment) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: payment",
    });
  }

  if (typeof payment === "string") payment = convertionToNumber(payment);
  if (typeof order_date === "string") order_date = order_date.trim();

  let calculateQuantities = (items) => {
    return Object.values(
      items.reduce((acc, item) => {
        if (!acc[item.stuff_id]) {
          acc[item.stuff_id] = { stuff_id: item.stuff_id, quantity: 0 };
        }
        acc[item.stuff_id].quantity += 1;
        return acc;
      }, {})
    );
  };

  let calculateItemDiscount = async (stuff_id) => {
    let q = await store.query(
      `
      SELECT
        stuff.stuff_id,
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
      GROUP BY stuff.stuff_id, stuff.current_sell_price`,
      [stuff_id]
    );

    if (!q.rows.length) return { price: 0, totalDiscount: 0 };

    let item = q.rows[0];
    let totalDiscount = 0;

    for (let d of item.discounts || []) {
      if (d.discount_status === true) {
        if (d.discount_type === "percentage") {
          totalDiscount += item.current_sell_price * (d.discount_value / 100);
        } else if (d.discount_type === "fixed") {
          totalDiscount += d.discount_value;
        }
      }
    }

    return {
      price: parseFloat(item.current_sell_price) - totalDiscount,
      totalDiscount,
    };
  };

  let calculateOrderDiscount = async (discounts, grandTotal) => {
    let total = 0;
    for (let d of discounts || []) {
      let q = await store.query(
        `SELECT discount_type, discount_status, discount_value 
         FROM discount WHERE discount_id = $1`,
        [d.discount_id]
      );

      let data = q.rows[0];
      if (data?.discount_status) {
        if (data.discount_type === "percentage") {
          total += grandTotal * (data.discount_value / 100);
        } else {
          total += parseFloat(data.discount_value);
        }
      }
    }
    return total;
  };

  async function verifyAndGetStuffInfo(item) {
    let identifiers = [
      { key: "imei_1", value: item.imei_1 },
      { key: "imei_2", value: item.imei_2 },
      { key: "sn", value: item.sn },
    ].filter((i) => i.value);

    if (!identifiers.length)
      throw new Error("No validated imei/sn provided for item");

    let validStuffInfoId = null;
    let errors = [];

    for (let id of identifiers) {
      let q = await store.query(
        `SELECT * FROM stuff_information WHERE stuff_id = $1 AND ${id.key} = $2`,
        [item.stuff_id, id.value]
      );

      if (!q.rows.length) {
        errors.push(`${id.key} "${id.value}" not registered`);
        continue;
      }

      let row = q.rows[0];

      if (row.stock_status !== "ready") {
        errors.push(`${id.key} "${id.value}" already ${row.stock_status}`);
        continue;
      }

      if (validStuffInfoId && validStuffInfoId !== row.stuff_information_id) {
        errors.push("Inconsistent identifiers detected");
      }

      validStuffInfoId = row.stuff_information_id;
    }

    if (errors.length) throw new Error(errors.join(" | "));

    return { stuff_information_id: validStuffInfoId };
  }

  try {
    await store.query("BEGIN");

    let totalItemDiscount = 0;
    let grandTotal = 0;
    let quantities = calculateQuantities(items);

    for (let item of items) {
      let { price, totalDiscount } = await calculateItemDiscount(item.stuff_id);
      grandTotal += price;
      totalItemDiscount += totalDiscount;
    }

    let orderDiscount = await calculateOrderDiscount(discounts, grandTotal);
    let totalPayment = grandTotal - orderDiscount;
    let remainingPayment = payment - totalPayment;

    let employeeQuery = await store.query(
      `
      SELECT employee.employee_id
      FROM employee
      JOIN employee_account 
        ON employee_account.employee_id = employee.employee_id
      WHERE employee_account.employee_account_id = $1
    `,
      [account.id]
    );

    let employeeId = employeeQuery.rows[0].employee_id;

    let orderQuery = await store.query(
      `
      INSERT INTO customer_order
      (customer_id, payment_method_id, employee_id, order_date, payment, sub_total, remaining_payment)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING order_id
    `,
      [
        customer_id,
        payment_method_id,
        employeeId,
        order_date,
        payment,
        totalPayment,
        remainingPayment,
      ]
    );

    let orderId = orderQuery.rows[0].order_id;

    for (let d of discounts || []) {
      await store.query(
        "INSERT INTO order_discount (order_id, discount_id) VALUES ($1,$2)",
        [orderId, d.discount_id]
      );
    }

    for (let item of items) {
      let { stuff_information_id } = await verifyAndGetStuffInfo(item);

      await store.query(
        `INSERT INTO stock (warehouse_id, stuff_id, stuff_information_id, stock_type)
         VALUES ($1,$2,$3,'out')`,
        [warehouse_id, item.stuff_id, stuff_information_id]
      );

      await store.query(
        `
        INSERT INTO customer_order_detail
        (stuff_id, order_id, warehouse_id, imei_1, imei_2, sn, barcode, total_item_discount, total_order_discount)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        `,
        [
          item.stuff_id,
          orderId,
          warehouse_id,
          item.imei_1,
          item.imei_2,
          item.sn,
          item.barcode,
          totalItemDiscount,
          orderDiscount,
        ]
      );

      await store.query(
        `UPDATE stuff_information
         SET stock_status = 'sold'
         WHERE stuff_information_id = $1`,
        [stuff_information_id]
      );
    }

    for (let q of quantities) {
      let stockQuery = await store.query(
        "SELECT total_stock FROM stuff WHERE stuff_id = $1 FOR UPDATE",
        [q.stuff_id]
      );

      if (stockQuery.rows[0].total_stock < q.quantity)
        throw new Error("Stock insufficient");

      await store.query(
        "UPDATE stuff SET total_stock = total_stock - $1 WHERE stuff_id = $2",
        [q.quantity, q.stuff_id]
      );
    }

    await store.query("COMMIT");

    return res.status(201).json({
      status: 201,
      message: "Success create order",
    });
  } catch (err) {
    await store.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: err.message || "Internal server error",
    });
  }
});

app.use(errorHandler);
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
