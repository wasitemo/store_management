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
pg.types.setTypeParser(1082, (val) => val);
const app = express();
const saltRounds = 12;
const upload = multer({ dest: "uploads" });
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

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
      return res.status(403).json({
        status: 403,
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

app.post("/add-employee", verifyToken, async (req, res) => {
  let { employee_nik, employee_name, employee_address, employee_contact } =
    req.body;

  if (!employee_nik) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: employee_nik",
    });
  } else if (!employee_name) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: employee_name",
    });
  } else if (!employee_address) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: employee_address",
    });
  } else if (!employee_contact) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: employee_contact",
    });
  }

  try {
    const checkResult = await db.query(
      "SELECT * FROM employee WHERE employee_nik = $1",
      [employee_nik]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "NIK already used",
      });
    } else {
      await db.query(
        "INSERT INTO employee (employee_nik, employee_name, employee_contact, employee_address) VALUES ($1, $2, $3, $4)",
        [employee_nik, employee_name, employee_contact, employee_address]
      );

      return res.status(200).json({
        status: 200,
        message: "Success add employee",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

app.patch("/update-employee/:employee_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.employee_id);
  let update = req.body;
  let keys = Object.keys(update);
  let fields = [
    "employee_nik",
    "employee_name",
    "employee_contact",
    "employee_address",
  ];
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
      message: "No items updated",
    });
  }

  let setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(",");
  let values = Object.values(update);

  try {
    await db.query(
      `UPDATE employee SET ${setQuery} WHERE employee_id = $${keys.length + 1}`,
      [...values, reqId]
    );

    return res.status(200).json({
      status: 200,
      message: "Success update data",
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

// WAREHOUSE
app.post("/add-warehouse", verifyToken, async (req, res) => {
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

  try {
    await db.query(
      "INSERT INTO warehouse (warehouse_name, warehouse_address) VALUES ($1, $2)",
      [warehouse_name, warehouse_address]
    );

    return res.status(200).json({
      status: 200,
      message: "Success add warehouse",
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

app.patch("/update-warehouse/:warehouse_id", verifyToken, async (req, res) => {
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
      message: "No items updated",
    });
  }

  let setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(",");
  let values = Object.values(update);

  try {
    await db.query(
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
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

// SUPPLIER
app.post("/add-supplier", verifyToken, async (req, res) => {
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

  try {
    await db.query(
      "INSERT INTO supplier (supplier_name, supplier_contact, supplier_address) VALUES ($1, $2, $3)",
      [supplier_name, supplier_contact, supplier_address]
    );

    return res.status(200).json({
      status: 200,
      message: "Success add supplier",
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

app.patch("/update-supplier/:supplier_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.supplier_id);
  let update = req.body;
  let keys = Object.keys(update);
  let fields = ["supplier_name", "supplier_contact", "supplier_address"];
  let invalidField = keys.filter((k) => !fields.includes(k));

  if (invalidField.length > 0) {
    return res.status(400).json({
      status: 400,
      message: "Invalid field",
      invalidField,
    });
  }

  if (keys.length === 0) {
    return res.status(400).json({
      status: 400,
      message: "No item updated",
    });
  }

  let setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(",");
  let values = Object.values(update);

  try {
    await db.query(
      `UPDATE supplier SET ${setQuery} WHERE supplier_id = $${keys.length + 1}`,
      [...values, reqId]
    );

    return res.status(200).json({
      status: 200,
      message: "Sucess updated data",
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

// STUFF
app.use("/add-stuff-category", verifyToken, async (req, res) => {
  const { stuff_category_name } = req.body;

  if (!stuff_category_name) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: stuff_category_name",
    });
  }

  try {
    await db.query(
      "INSERT INTO stuff_category (stuff_category_name) VALUES ($1)",
      [stuff_category_name]
    );

    return res.status(200).json({
      status: 200,
      message: "Success add stuff category",
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

app.patch(
  "/update-stuff-category/:stuff_category_id",
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
        message: "No items updated",
      });
    }

    let setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(",");
    let values = Object.values(update);

    try {
      await db.query(
        `UPDATE stuff_category SET ${setQuery} WHERE stuff_category_id = $${
          keys.length + 1
        }`,
        [...values, reqId]
      );

      return res.status(200).json({
        status: 200,
        message: "Success update stuff category",
      });
    } catch (err) {
      console.error(err);
      return res.status(400).json({
        status: 400,
        message: err.message,
      });
    }
  }
);

app.post("/add-stuff-brand", verifyToken, async (req, res) => {
  let { stuff_brand_name } = req.body;

  if (!stuff_brand_name) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: stuff_brand_name",
    });
  }

  try {
    await db.query("INSERT INTO stuff_brand (stuff_brand_name) VALUES ($1)", [
      stuff_brand_name,
    ]);

    return res.status(200).json({
      status: 200,
      message: "Success add stuff brand",
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

app.patch(
  "/update-stuff-brand/:stuff_brand_id",
  verifyToken,
  async (req, res) => {
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
        message: "No items updated",
      });
    }

    let setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(",");
    let values = Object.values(update);

    try {
      await db.query(
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
      return res.status(400).json({
        status: 400,
        message: err.message,
      });
    }
  }
);

app.post("/add-stuff", verifyToken, async (req, res) => {
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
  } = req.body;

  if (
    typeof current_sell_price === "string" &&
    current_sell_price.includes(",")
  ) {
    let newValue = current_sell_price.replace(",", ".");
    let parsed = parseFloat(newValue);

    if (!isNaN(parsed)) {
      payment = parsed;
    }
  }

  if (!stuff_category_id) {
    return res.status(404).json({
      status: 404,
      message: "Missing required key: stuff_category_id",
    });
  } else if (!stuff_brand_id) {
    return res.status(404).json({
      status: 404,
      message: "Missing required key: stuff_brand_id",
    });
  } else if (!supplier_id) {
    return res.status(404).json({
      status: 404,
      message: "Missing required key: supplier_id",
    });
  } else if (!stuff_code) {
    return res.status(404).json({
      status: 404,
      message: "Missing required key: stuff_code",
    });
  } else if (!stuff_sku) {
    return res.status(404).json({
      status: 404,
      message: "Missing required key: stuff_sku",
    });
  } else if (!stuff_name) {
    return res.status(404).json({
      status: 404,
      message: "Missing required key: stuff_name",
    });
  } else if (!stuff_variant) {
    return res.status(404).json({
      status: 404,
      message: "Missing required key: stuff_variant",
    });
  } else if (!current_sell_price) {
    return res.status(404).json({
      status: 404,
      message: "Missing required key: current_sell_price",
    });
  } else if (!has_sn) {
    return res.status(404).json({
      status: 404,
      message: "Missing required key: has_sn",
    });
  } else if (!barcode) {
    return res.status(404).json({
      status: 404,
      message: "Missing required key: barcode",
    });
  }

  try {
    await db.query("BEGIN");

    let refreshToken = req.cookies.refreshToken;

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, account) => {
        if (err) {
          return res.status(403).json({
            status: 403,
            message: "Token is no longer valid",
          });
        } else {
          let stuffQuery = await db.query(
            "INSERT INTO stuff (stuff_category_id, stuff_brand_id, supplier_id, stuff_code, stuff_sku, stuff_name, stuff_variant, current_sell_price, has_sn, barcode) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
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
          let stuffData = stuffQuery.rows[0];
          let stuffId = stuffQuery.rows[0].stuff_id;

          await db.query(
            "INSERT INTO stuff_history (stuff_id, employee_id, operation, new_data) VALUES ($1, $2, 'insert', $3)",
            [stuffId, account.id, stuffData]
          );
        }
      }
    );

    await db.query("COMMIT");

    return res.json({
      status: 200,
      message: "Success add stuff",
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

app.patch("/update-stuff/:stuff_id", verifyToken, async (req, res) => {
  let reqId = parseInt(req.params.stuff_id);
  let update = req.body;
  let keys = Object.keys(update);
  let fields = {
    stuff_category_id: "number",
    stuff_brand_id: "number",
    supplier_id: "number",
    stuff_code: "number",
    stuff_sku: "string",
    stuff_name: "string",
    stuff_variant: "string",
    current_sell_price: "number",
    has_sn: "boolean",
    barcode: "string",
  };
  let invalidFields = keys.filter((k) => !fields[k]);

  for (let key of keys) {
    let expectedType = fields[key];
    let value = update[key];

    if (expectedType === "number") {
      update[key] = convertionToNumber(value);
    }
  }

  if (invalidFields.length > 0) {
    await db.query("ROLLBACK");
    return res.status(400).json({
      status: 400,
      message: "Invalid field ",
      invalidFields,
    });
  }

  if (keys.length === 0) {
    await db.query("ROLLBACK");
    return res.status(400).json({
      status: 400,
      message: "No items updated",
    });
  }

  let setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(", ");
  let values = Object.values(update);

  try {
    await db.query("BEGIN");

    let refreshToken = req.cookies.refreshToken;

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, account) => {
        if (err) {
          return res.status(400).json({
            status: 400,
            message: "Token is no longer valid",
          });
        } else {
          let oldDataQuery = await db.query(
            "SELECT * FROM stuff WHERE stuff_id = $1",
            [reqId]
          );
          let stuffQuery = await db.query(
            `UPDATE stuff SET ${setQuery} WHERE stuff_id = $${
              keys.length + 1
            } RETURNING *`,
            [...values, reqId]
          );
          let stuffId = stuffQuery.rows[0].stuff_id;
          let oldData = oldDataQuery.rows[0];
          let newData = stuffQuery.rows[0];

          await db.query(
            "INSERT INTO stuff_history (stuff_id, employee_id, operation, old_data, new_data) VALUES ($1, $2, 'update', $3, $4)",
            [stuffId, account.id, oldData, newData]
          );

          return res.status(200).json({
            status: 200,
            message: "Succes updated data",
          });
        }
      }
    );

    await db.query("COMMIT");
  } catch (err) {
    await db.query("ROLLBACK");
    console.error(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

app.post("/add-stuff-purchase", verifyToken, async (req, res) => {
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

  if (!supplier_id) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: supplier_id",
    });
  } else if (!buy_date) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: buy_date",
    });
  } else if (!total_price) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: buy_date",
    });
  } else if (!warehouse_id) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: warehous_id",
    });
  } else if (!stuff_id) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: stuff_id",
    });
  } else if (!buy_batch) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: buy_batch",
    });
  } else if (!quantity) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: quantity",
    });
  } else if (!buy_price) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: buy_price",
    });
  }

  if (typeof total_price === "string") {
    total_price = convertionToNumber(total_price);
  }

  if (typeof buy_price === "string") {
    buy_price = convertionToNumber(buy_price);
  }

  if (typeof quantity === "string") {
    quantity = convertionToNumber(quantity);
  }

  try {
    await db.query("BEGIN");

    let refreshToken = req.cookies.refreshToken;

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, account) => {
        if (err) {
          return res.status(400).json({
            status: 400,
            message: "Token is no longer valid",
          });
        } else {
          const stuffPurchaseQuery = await db.query(
            "INSERT INTO stuff_purchase (supplier_id, employee_id, buy_date, total_price) VALUES ($1, $2, $3, $4) RETURNING stuff_purchase_id",
            [supplier_id, account.id, buy_date, total_price]
          );

          const purchaseId = stuffPurchaseQuery.rows[0].stuff_purchase_id;

          await db.query(
            "INSERT INTO stuff_purchase_detail (warehouse_id, stuff_id, stuff_purchase_id, buy_batch, quantity, buy_price) VALUES ($1, $2, $3, $4, $5, $6)",
            [warehouse_id, stuff_id, purchaseId, buy_batch, quantity, buy_price]
          );

          await db.query("COMMIT");

          return res.status(200).json({
            status: 200,
            message: "Purchase success",
          });
        }
      }
    );
  } catch (err) {
    await db.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: err.message,
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

      await db.query("BEGIN");

      let refreshToken = req.cookies.refreshToken;

      jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET,
        async (err, account) => {
          if (err) {
            await db.query("ROLLBACK");
            return res.status(400).json({
              status: 400,
              message: "Token is no longer valid",
            });
          } else {
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

              let supplierQuery = await db.query(
                "SELECT supplier_id FROM supplier WHERE LOWER (supplier_name) = $1",
                [supplier_name]
              );
              if (supplierQuery.rows.length === 0)
                throw new Error("Supplier not registered");
              let supplierId = supplierQuery.rows[0].supplier_id;

              let warehouseQuery = await db.query(
                "SELECT warehouse_id FROM warehouse WHERE LOWER (warehouse_name) = $1",
                [warehouse_name]
              );
              if (warehouseQuery.rows.length === 0)
                throw new Error("Warehouse not registered");
              let warehouseId = warehouseQuery.rows[0].warehouse_id;

              let stuffQuery = await db.query(
                "SELECT stuff_id FROM stuff WHERE LOWER (stuff_name) = $1",
                [stuff_name]
              );
              if (stuffQuery.rows.length === 0)
                throw new Error("Stuff not registered");
              let stuffId = stuffQuery.rows[0].stuff_id;

              let purchaseQuery = await db.query(
                "INSERT INTO stuff_purchase (supplier_id, employee_id, buy_date, total_price) VALUES ($1, $2, $3, $4) RETURNING stuff_purchase_id",
                [supplierId, account.id, buy_date, total_price]
              );
              let purchaseId = purchaseQuery.rows[0].stuff_purchase_id;

              await db.query(
                "INSERT INTO stuff_purchase_detail (warehouse_id, stuff_id, stuff_purchase_id, buy_batch, quantity, buy_price) VALUES ($1, $2, $3, $4, $5, $6)",
                [
                  warehouseId,
                  stuffId,
                  purchaseId,
                  buy_batch,
                  quantity,
                  buy_price,
                ]
              );
            }
          }
        }
      );

      await db.query("COMMIT");

      fs.unlinkSync(filePath);

      return res.status(200).json({
        status: 200,
        message: "Success created data",
      });
    } catch (err) {
      await db.query("ROLLBACK");
      console.error(err.message);
      return res.status(500).json({
        status: 500,
        message: err.message,
      });
    }
  }
);

// CUSTOMER
app.post("/add-customer", verifyToken, async (req, res) => {
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

  try {
    await db.query(
      "INSERT INTO customer (customer_name, customer_contact, customer_address) VALUES ($1, $2, $3)",
      [customer_name, customer_contact, customer_address]
    );

    return res.status(200).json({
      status: 200,
      message: "Success add customer",
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

app.patch("/update-customer/:customer_id", verifyToken, async (req, res) => {
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
      message: "No items updated",
    });
  }

  let setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(",");
  let values = Object.values(update);

  try {
    await db.query(
      `UPDATE customer SET ${setQuery} WHERE customer_id = $${keys.length + 1}`,
      [...values, reqId]
    );

    return res.status(200).json({
      status: 200,
      message: "Success updated data",
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

// PAYMENT METHODE
app.post("/add-payment-methode", verifyToken, async (req, res) => {
  let { payment_methode_name } = req.body;

  if (!payment_methode_name) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: payment_methode_name",
    });
  }

  try {
    await db.query(
      "INSERT INTO payment_methode (payment_methode_name) VALUES ($1)",
      [payment_methode_name]
    );

    return res.status(200).json({
      status: 200,
      message: "Success add payment methode",
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

app.patch(
  "/update-payment-methode/:payment_methode_id",
  verifyToken,
  async (req, res) => {
    let reqId = parseInt(req.params.payment_methode_id);
    let update = req.body;
    let keys = Object.keys(update);
    let fields = ["payment_methode_name"];
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
        message: "No items updated",
      });
    }

    let setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(",");
    let values = Object.values(update);

    try {
      await db.query(
        `UPDATE payment_methode SET ${setQuery} WHERE payment_methode_id = $${
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
      return res.status(400).json({
        status: 400,
        message: err.message,
      });
    }
  }
);

// DISCOUNT
app.post("/add-stuff-discount", verifyToken, async (req, res) => {
  let {
    stuff_id,
    discount_name,
    discount_type,
    discount_value,
    discount_start,
    discount_end,
    discount_status,
  } = req.body;

  if (typeof discount_type === "string") {
    discount_type = discount_type.toLowerCase();
  }

  if (typeof discount_value === "string") {
    if (discount_type === "percentage") {
      discount_value = convertionToDecimal(discount_value);
    } else if (discount_type === "fixed") {
      discount_value = convertionToNumber(discount_value);
    }
  }

  if (!stuff_id) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: stuff_id",
    });
  } else if (!discount_name) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: discount_name",
    });
  } else if (!discount_type) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: discount_type",
    });
  } else if (!discount_value) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: discount_value",
    });
  } else if (!discount_start) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: discount_start",
    });
  } else if (!discount_end) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: discount_end",
    });
  } else if (!discount_status) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: discount_status",
    });
  }

  try {
    await db.query("BEGIN");

    let refreshToken = req.cookies.refreshToken;

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, account) => {
        let employeeQuery = await db.query(
          "SELECT employee.employee_id FROM employee JOIN employee_account ON employee_account.employee_id = employee.employee_id WHERE employee_account.employee_account_id = $1",
          [account.id]
        );
        let employeeId = employeeQuery.rows[0].employee_id;

        if (err) {
          return res.status(400).json({
            status: 400,
            message: "Token is no longer valid",
          });
        } else {
          let discountQuery = await db.query(
            "INSERT INTO discount (employee_id, discount_name, discount_type, discount_value, started_time, ended_time, discount_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING discount_id",
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

          let discountId = discountQuery.rows[0].discount_id;

          await db.query(
            "INSERT INTO stuff_discount (stuff_id, discount_id) VALUES ($1, $2)",
            [stuff_id, discountId]
          );

          await db.query("COMMIT");

          return res.status(200).json({
            status: 200,
            message: "Success add stuff discount",
          });
        }
      }
    );
  } catch (err) {
    db.query("ROLLBACK");
    console.error(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

app.patch(
  "/update-stuff-discount/:discount_id",
  verifyToken,
  async (req, res) => {
    let reqId = parseInt(req.params.discount_id);
    let body = req.body;
    let discountFields = [
      "discount_name",
      "discount_type",
      "discount_value",
      "discount_start",
      "discount_end",
      "discount_status",
    ];
    let stuffDiscountFields = ["stuff_id"];
    let discountFieldsUpdate = {};

    if (typeof body.discount_type === "string") {
      body.discount_type = body.discount_type.toLowerCase();
    }

    if (typeof body.discount_value === "string") {
      if (body.discount_type === "percentage") {
        body.discount_value = convertionToDecimal(body.discount_value);
      } else if (body.discount_type === "fixed") {
        body.discount_value = convertionToNumber(body.discount_value);
      }
    }

    for (let key of discountFields) {
      if (body[key] !== undefined) {
        discountFieldsUpdate[key] = body[key];
      }
    }

    let stuffDiscountFieldsUpdate = {};

    for (let key of stuffDiscountFields) {
      if (body[key] !== undefined) {
        stuffDiscountFieldsUpdate[key] = body[key];
      }
    }

    try {
      await db.query("BEGIN");

      let refreshToken = req.cookies.refreshToken;

      jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET,
        async (err, account) => {
          let employeeQuery = await db.query(
            "SELECT employee.employee_id FROM employee JOIN employee_account ON employee_account.employee_id = employee.employee_id WHERE employee_account.employee_account_id = $1",
            [account.id]
          );
          let employeeId = employeeQuery.rows[0].employee_id;

          if (err) {
            return res.status(400).json({
              status: 400,
              message: "Token is no longer valid",
            });
          } else {
            if (Object.keys(discountFieldsUpdate.length > 0)) {
              let setQuery = Object.keys(discountFieldsUpdate)
                .map((key, index) => `${key} = $${index + 1}`)
                .join(", ");
              let values = Object.values(discountFieldsUpdate);

              setQuery += `, employee_id = $${values.length + 1}`;

              await db.query(
                `UPDATE discount SET ${setQuery} WHERE discount_id = $${
                  values.length + 2
                }`,
                [...values, employeeId, reqId]
              );
            }

            if (Object.keys(stuffDiscountFieldsUpdate).length > 0) {
              let setQuery = Object.keys(stuffDiscountFieldsUpdate)
                .map((key, index) => `${key} = $${index + 1}`)
                .join(", ");
              let values = Object.values(stuffDiscountFieldsUpdate);

              await db.query(
                `UPDATE stuff_discount SET ${setQuery} WHERE discount_id = $${
                  values.length + 1
                }`,
                [...values, reqId]
              );
            }

            return res.status(200).json({
              status: 200,
              message: "Success updated data",
            });
          }
        }
      );

      await db.query("COMMIT");
    } catch (err) {
      await db.query("ROLLBACK");
      console.error(err);
      return res.status(400).json({
        status: 400,
        message: err.message,
      });
    }
  }
);

app.post("/add-order-discount", verifyToken, async (req, res) => {
  let {
    discount_name,
    discount_type,
    discount_value,
    discount_start,
    discount_end,
    discount_status,
  } = req.body;

  if (typeof discount_type === "string") {
    discount_type = discount_type.toLowerCase();
  }

  if (typeof discount_value === "string") {
    if (discount_type === "percentage") {
      discount_value = convertionToDecimal(discount_value);
    } else if (discount_type === "fixed") {
      discount_value = convertionToNumber(discount_value);
    }
  }

  if (!discount_name) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: discount_name",
    });
  } else if (!discount_type) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: discount_type",
    });
  } else if (!discount_value) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: discount_value",
    });
  } else if (!discount_start) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key discount_start",
    });
  } else if (!discount_end) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key discount_end",
    });
  } else if (!discount_status) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key discount_status",
    });
  }

  try {
    let refreshToken = req.cookies.refreshToken;

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, account) => {
        if (err) {
          return res.status(400).json({
            status: 400,
            message: "Token is no longer valid",
          });
        } else {
          let employeeQuery = await db.query(
            "SELECT employee.employee_id FROM employee JOIN employee_account ON employee_account.employee_id = employee.employee_id WHERE employee_account.employee_account_id = $1",
            [account.id]
          );
          let employeeId = employeeQuery.rows[0].employee_id;

          await db.query(
            "INSERT INTO discount (employee_id, discount_name, discount_type, discount_value, started_time, ended_time, discount_status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING discount_id",
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

          return res.status(200).json({
            status: 200,
            message: "Success add discount",
          });
        }
      }
    );
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

app.patch(
  "/update-order-discount/:discount_id",
  verifyToken,
  async (req, res) => {
    let reqId = parseInt(req.params.discount_id);
    let body = req.body;
    let fields = [
      "discount_name",
      "discount_type",
      "discount_value",
      "discount_start",
      "discount_end",
      "discount_status",
    ];
    let keys = Object.keys(body);
    let invalidField = keys.filter((k) => !fields.includes(k));

    if (invalidField.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Invalid field",
        invalidField,
      });
    }

    if (keys.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "No items updated",
      });
    }

    if (typeof body.discount_type === "string") {
      body.discount_type = body.discount_type.toLowerCase();
    }

    if (typeof body.discount_value === "string") {
      if (body.discount_type === "percentage") {
        body.discount_value = convertionToDecimal(body.discount_value);
      } else if (body.discount_type === "fixed") {
        body.discount_value = convertionToNumber(body.discount_value);
      }
    }

    let setQuery = keys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");
    let values = Object.values(body);

    try {
      let refreshToken = req.cookies.refreshToken;

      jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET,
        async (err, account) => {
          let employeeQuery = await db.query(
            "SELECT employee.employee_id FROM employee JOIN employee_account ON employee_account.employee_id = employee.employee_id WHERE employee_account.employee_account_id = $1",
            [account.id]
          );
          let employeeId = employeeQuery.rows[0].employee_id;

          if (err) {
            return res.status(400).json({
              status: 400,
              message: "Token is no longer valid",
            });
          } else {
            setQuery += `, employee_id = $${keys.length + 1}`;

            await db.query(
              `UPDATE discount SET ${setQuery} WHERE discount_id = $${
                keys.length + 2
              }`,
              [...values, employeeId, reqId]
            );

            return res.status(200).json({
              status: 200,
              message: "Success updated data",
            });
          }
        }
      );
    } catch (err) {
      console.error(err);
      return res.status(400).json({
        status: 400,
        message: err.message,
      });
    }
  }
);

// ACCOUNT
app.post("/create-account", verifyToken, async (req, res) => {
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
    account_status = account_status.toLowerCase();
  }

  try {
    const checkResult = await db.query(
      "SELECT * FROM employee_account WHERE username = $1",
      [username]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Username already used",
      });
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password : ", err);
        } else {
          await db.query(
            "INSERT INTO employee_account (employee_id, username, password, role, account_status) VALUES ($1, $2, $3, $4, $5)",
            [employee_id, username, hash, role, account_status]
          );

          return res.status(200).json({
            status: 200,
            message: "Create account success",
          });
        }
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

app.post("/login", async (req, res) => {
  let { username, password } = req.body;
  const accountQuery = await db.query(
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
        return res.status(400).json({
          status: 400,
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

          await db.query(
            "INSERT INTO refresh_token (employee_account_id, token_jti, expires_at) VALUES ($1, $2, $3)",
            [account.employee_account_id, refreshToken, expiresAt]
          );

          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });

          return res.status(200).json({
            status: 200,
            message: accessToken,
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
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

app.patch("/update-account/:employee_account_id", async (req, res) => {
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
    await db.query(
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
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

app.use("/refresh-token", async (req, res) => {
  try {
    let refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        status: 401,
        message: "No refresh token provided",
      });
    }

    let query = await db.query(
      "SELECT * FROM refresh_token WHERE token_jti = $1",
      [refreshToken]
    );
    let queryToken = query.rows[0];

    if (!queryToken) {
      return res.status(403).json({
        status: 403,
        message: "Invalid refresh token",
      });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, account) => {
      if (err) {
        return res.status(403).json({
          status: 403,
          message: "Token is no longer valid",
        });
      }

      let newAccessToken = generateAccessToken(account);

      res.status(200).json({
        status: 200,
        message: newAccessToken,
      });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  }
});

app.post("/logout", async (req, res) => {
  try {
    let refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await db.query("DELETE from refresh_token WHERE token_jti = $1", [
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
      message: "Server error",
    });
  }
});

// STOCK
app.post("/add-stock", async (req, res) => {
  let { warehouse_id, stuff_id, imei_1, imei_2, sn } = req.body;

  if (!warehouse_id) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: warehouse_id",
    });
  } else if (!stuff_id) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: stuff_id",
    });
  } else if (!imei_1) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: imei_1",
    });
  } else if (!imei_2) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: imei_2",
    });
  } else if (!sn) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: sn",
    });
  }

  if (typeof stock_status === "string") {
    stock_status = stock_status.toLowerCase();
  }

  try {
    await db.query("BEGIN");

    let stuffInfoQuery = await db.query(
      "INSERT INTO stuff_information (stuff_id, imei_1, imei_2, sn, stock_status) VALUES ($1, $2, $3, $4, 'ready') RETURNING stuff_information_id",
      [stuff_id, imei_1, imei_2, sn]
    );

    let stuffInfoId = stuffInfoQuery.rows[0].stuff_information_id;

    await db.query(
      "INSERT INTO stock (warehouse_id, stuff_id, stuff_information_id, stock_type) VALUES ($1, $2, $3, 'in')",
      [warehouse_id, stuff_id, stuffInfoId]
    );

    await db.query(
      "UPDATE stuff SET total_stock = (SELECT COUNT(*) FROM stuff_information WHERE stuff_id = $1 AND stock_status = 'ready') WHERE stuff_id = $2",
      [stuff_id, stuff_id]
    );

    await db.query("COMMIT");

    return res.json({
      status: 200,
      message: "Success update stock",
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

app.post("/upload-stock", upload.single("file"), async (req, res) => {
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

    await db.query("BEGIN");

    for (let i = 0; i < rows.length; i++) {
      let item = rows[i];

      for (let key in item) {
        if (typeof item[key] === "string") {
          item[key] = item[key].toLowerCase();
        }
      }

      let { warehouse_name, stuff_name, imei_1, imei_2, sn } = item;

      let warehouseQuery = await db.query(
        "SELECT warehouse_id FROM warehouse WHERE LOWER (warehouse_name) = $1",
        [warehouse_name]
      );
      if (warehouseQuery.rows.length === 0)
        throw new Error("Warehouse not registered");
      let warehouseId = warehouseQuery.rows[0].warehouse_id;

      let stuffQuery = await db.query(
        "SELECT stuff_id FROM stuff WHERE LOWER (stuff_name) = $1",
        [stuff_name]
      );
      if (stuffQuery.rows.length === 0) throw new Error("Stuff not registered");
      let stuffId = stuffQuery.rows[0].stuff_id;

      let stuffInfoQuery = await db.query(
        "INSERT INTO stuff_information (stuff_id, imei_1, imei_2, sn, stock_status) VALUES ($1, $2, $3, $4, 'ready') RETURNING stuff_information_id",
        [stuffId, imei_1, imei_2, sn]
      );
      let stuffInfoId = stuffInfoQuery.rows[0].stuff_information_id;

      await db.query(
        "INSERT INTO stock (warehouse_id, stuff_id, stuff_information_id, stock_type) VALUES ($1, $2, $3, 'in')",
        [warehouseId, stuffId, stuffInfoId]
      );
      await db.query(
        "UPDATE stuff SET total_stock = (SELECT COUNT(*) FROM stuff_information WHERE stuff_id = $1 AND stock_status = 'ready') WHERE stuff_id = $2",
        [stuffId, stuffId]
      );
    }

    await db.query("COMMIT");
    return res.status(200).json({
      status: 200,
      message: "Success update stock",
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error(err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

// CUSTOMER ORDER
app.post("/add-order", async (req, res) => {
  let {
    customer_id,
    warehouse_id,
    payment_methode_id,
    order_date,
    payment,
    items,
    discounts,
  } = req.body;

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
  } else if (!payment_methode_id) {
    return res.status(400).json({
      status: 400,
      message: "Missing required key: payment_methode_id",
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

  if (typeof payment === "string") {
    payment = convertionToNumber(payment);
  }

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
    let discountItemQuery = await db.query(
      `
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
      GROUP BY stuff.stuff_id, stuff.stuff_name, stuff.current_sell_price`,
      [stuff_id]
    );

    if (discountItemQuery.rows.length === 0) {
      return { price: 0, discount: 0 };
    }

    let item = discountItemQuery.rows[0];
    let totalDiscount = 0;

    for (let d of item.discounts) {
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

  let calculateOrderDiscount = async (discounts, grandTotalItem) => {
    let totalOrderDiscount = 0;

    for (let d of discounts) {
      let discountOrderQuery = await db.query(
        "SELECT discount_id, discount_type, discount_status, discount_value FROM discount WHERE discount_id = $1",
        [d.discount_id]
      );

      let discountData = discountOrderQuery.rows[0];

      if (discountData && discountData.discount_status === true) {
        if (discountData.discount_type === "percentage") {
          totalOrderDiscount +=
            grandTotalItem * (parseFloat(discountData.discount_value) / 100);
        } else if (discountData.discount_type === "fixed") {
          totalOrderDiscount += parseFloat(discountData.discount_value);
        }
      }
    }

    return parseFloat(totalOrderDiscount);
  };

  async function verifyAndGetStuffInfo(item, warehouseId) {
    let identifiers = [
      { key: "imei_1", value: item.imei_1 },
      { key: "imei_2", value: item.imei_2 },
      { key: "sn", value: item.sn },
    ].filter((stuff_id) => stuff_id.value);

    if (identifiers.length === 0) {
      throw new Error("No validated imei/sn provided for item");
    }

    let stuffQuery = await db.query(
      "SELECT stuff_name FROM stuff WHERE stuff_id = $1",
      [item.stuff_id]
    );
    let stuffName = stuffQuery.rows[0]?.stuff_name || "Unknwon stuff";

    let validStuffInfoId = null;
    let errors = [];

    for (let identifier of identifiers) {
      let { key, value } = identifier;

      let query = `
        SELECT * FROM stuff_information
        WHERE stuff_id = $1 AND ${key} = $2
      `;
      let result = await db.query(query, [item.stuff_id, value]);

      if (result.rows.length === 0) {
        errors.push(
          `Identifer ${key} "${value}" is not registered for ${stuffName} (ID: ${item.stuff_id})`
        );
        continue;
      }

      let row = result.rows[0];

      if (row.stock_status !== "ready") {
        errors.push(
          `Identifier ${key} "${value}" for ${stuffName} is already ${row.stock_status}`
        );
        continue;
      }

      if (validStuffInfoId && validStuffInfoId !== row.stuff_information_id) {
        errors.push(
          `Data inconsictency detected for ${stuffName}. The provided identifiers point to different internal records`
        );
      } else {
        validStuffInfoId = row.stuff_information_id;
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(" "));
    }

    if (!validStuffInfoId) {
      throw new Error(
        `Could not determine valid stock information for ${stuffName}`
      );
    }

    return { stuff_information_id: validStuffInfoId };
  }

  try {
    await db.query("BEGIN");

    let saveTotalDiscountItem = 0;
    let saveTotalDiscountOrder = 0;
    let grandTotalItem = 0;
    let quantities = calculateQuantities(items);

    for (let item of items) {
      let { price, totalDiscount } = await calculateItemDiscount(item.stuff_id);

      grandTotalItem += price;
      saveTotalDiscountItem += totalDiscount;
    }

    saveTotalDiscountOrder = await calculateOrderDiscount(
      discounts,
      grandTotalItem
    );

    let totalPayment = grandTotalItem - saveTotalDiscountOrder;
    let remainingPayment = payment - totalPayment;
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

    let employeeQuery = await db.query(
      `
        SELECT employee.employee_id
        FROM employee
        JOIN employee_account
        ON employee_account.employee_id = employee.employee_id
        WHERE employee.employee_id = $1
    `,
      [account.id]
    );
    let employeeId = employeeQuery.rows[0].employee_id;

    let orderQuery = await db.query(
      `
        INSERT INTO customer_order
        (customer_id, payment_methode_id, employee_id, order_date, payment, sub_total, remaining_payment)
        VALUES
        ($1, $2, $3, $4, $5, $6, $7) RETURNING order_id
    `,
      [
        customer_id,
        payment_methode_id,
        employeeId,
        order_date,
        payment,
        totalPayment,
        remainingPayment,
      ]
    );
    let orderId = orderQuery.rows[0].order_id;

    for (let d of discounts) {
      await db.query(
        "INSERT INTO order_discount (order_id, discount_id) VALUES ($1, $2)",
        [orderId, d.discount_id]
      );
    }

    for (let item of items) {
      let { stuff_information_id } = await verifyAndGetStuffInfo(
        item,
        warehouse_id
      );

      await db.query(
        `
        INSERT INTO stock
        (warehouse_id, stuff_id, stuff_information_id, stock_type)
        VALUES
        ($1, $2, $3, $4)
      `,
        [warehouse_id, item.stuff_id, stuff_information_id, "out"]
      );

      await db.query(
        `
        INSERT INTO customer_order_detail
        (stuff_id, order_id, warehouse_id, imei_1, imei_2, sn, barcode, total_item_discount, total_order_discount)
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
        [
          item.stuff_id,
          orderId,
          warehouse_id,
          item.imei_1,
          item.imei_2,
          item.sn,
          item.barcode,
          saveTotalDiscountItem,
          saveTotalDiscountOrder,
        ]
      );

      await db.query(
        "UPDATE stuff_information SET stock_status = 'sold' WHERE stuff_id = $1 AND (imei_1 = $2 OR imei_2 = $3 OR sn = $4)",
        [item.stuff_id, item.imei_1, item.imei_2, item.sn]
      );
    }

    for (let q of quantities) {
      let stockQuery = await db.query(
        "SELECT total_stock FROM stuff WHERE stuff_id = $1 FOR UPDATE",
        [q.stuff_id]
      );

      let stuffWarehouseQuery = await db.query(
        `
        SELECT * FROM stuff
        JOIN stock ON stock.stuff_id = stuff.stuff_id
        WHERE stuff.stuff_id = $1 AND warehouse_id = $2
      `,
        [q.stuff_id, warehouse_id]
      );

      let warehouseQuery = await db.query(
        "SELECT warehouse_name FROM warehouse WHERE warehouse_id = $1",
        [warehouse_id]
      );
      let warehouseName = warehouseQuery.rows[0].warehouse_name;

      let stuffQuery = await db.query(
        "SELECT stuff_name FROM stuff WHERE stuff_id = $1",
        [q.stuff_id]
      );
      let stuffName = stuffQuery.rows[0].stuff_name;

      if (stuffWarehouseQuery.rows.length === 0) {
        return res.status(400).json({
          status: 400,
          message: `${stuffName} is not available in ${warehouseName}`,
        });
      }

      if (stockQuery.rows.length === 0) {
        await db.query("ROLLBACK");
        return res.status(400).json({
          status: 400,
          message: "Stuff not found",
        });
      }

      let stock = parseInt(stockQuery.rows[0].total_stock);

      if (stock < q.quantity) {
        await db.query("ROLLBACK");
        return res.status(400).json({
          status: 400,
          message: `Stock insufficient for stuff id ${q.stuff_id}`,
        });
      }

      await db.query(
        "UPDATE stuff SET total_stock = total_stock - $1 WHERE stuff_id = $2",
        [q.quantity, q.stuff_id]
      );
    }

    await db.query("COMMIT");

    return res.status(200).json({
      status: 200,
      message: "Success create order",
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Transaction failed:", err);
    return res.status(400).json({
      status: 400,
      message: err.message,
    });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
