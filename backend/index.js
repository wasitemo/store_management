import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import XLSX from "xlsx";
import store from "./src/config/store.js";
import errorHandler from "./src/middleware/errorHandler.js";
import authRoute from "./src/route/authRoute.js";
import employeeRoute from "./src/route/employeeRoute.js";
import warehouseRoute from "./src/route/warehouseRoute.js";
import supplierRoute from "./src/route/supplierRoute.js";
import stuffCategoryRoute from "./src/route/stuffCategoryRoute.js";
import stuffBrandRoute from "./src/route/stuffBrandRoute.js";
import stuffRoute from "./src/route/stuffRoute.js";
import stuffHistoryRoute from "./src/route/stuffHistoryRoute.js";
import imeiSnRoute from "./src/route/imeiSnRoute.js";
import stuffPurchaseRoute from "./src/route/stuffPurchaseRoute.js";
import stuffPurchaseDetailRoute from "./src/route/stuffPurchaseDetailRoute.js";
import customerRoute from "./src/route/customerRoute.js";

const app = express();
const BACKEND_PORT = process.env.BACKEND_PORT;
const upload = multer({
  dest: "uploads",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3001");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

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
    date_info.getDate(),
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

app.use("/", authRoute);
app.use("/", employeeRoute);
app.use("/", warehouseRoute);
app.use("/", supplierRoute);
app.use("/", stuffCategoryRoute);
app.use("/", stuffBrandRoute);
app.use("/", stuffRoute);
app.use("/", stuffHistoryRoute);
app.use("/", imeiSnRoute);
app.use("/", stuffPurchaseRoute);
app.use("/", stuffPurchaseDetailRoute);
app.use("/", customerRoute);

// PAYMENT METHODE
app.get("/payment-methods", async (req, res) => {
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

app.post("/payment-method", async (req, res) => {
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
      [payment_method_name],
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

app.get("/payment-method/:payment_method_id", async (req, res) => {
  let reqId = parseInt(req.params.payment_method_id);

  try {
    let query = await store.query(
      "SELECT * FROM payment_method WHERE payment_method_id = $1",
      [reqId],
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
        [...values, reqId],
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
  },
);

// DISCOUNT
app.get("/stuff-discounts", async (req, res) => {
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

app.get("/stuff-discount", async (req, res) => {
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

app.post("/stuff-discount", async (req, res) => {
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
      [account.id],
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
      ],
    );

    const discountId = discountQuery.rows[0].discount_id;

    await store.query(
      "INSERT INTO stuff_discount (stuff_id, discount_id) VALUES ($1, $2)",
      [stuff_id, discountId],
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

app.get("/stuff-discount/:stuff_id", async (req, res) => {
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
      [reqId],
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

app.patch("/stuff-discount/:discount_id", async (req, res) => {
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
        discountUpdate.discount_value,
      );
    } else if (discountUpdate.discount_type === "fixed") {
      discountUpdate.discount_value = convertionToNumber(
        discountUpdate.discount_value,
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
      [account.id],
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
        [...values, employeeId, discountId],
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
        [...values, discountId],
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

app.get("/order-discounts", async (req, res) => {
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

app.post("/order-discount", async (req, res) => {
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
      [req.user.id],
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
      ],
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

app.get("/order-discount/:discount_id", async (req, res) => {
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
      [reqId],
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

app.patch("/stuff-discount/:discount_id", async (req, res) => {
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
        discountUpdate.discount_value,
      );
    } else if (discountUpdate.discount_type === "fixed") {
      discountUpdate.discount_value = convertionToNumber(
        discountUpdate.discount_value,
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
      [account.id],
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
        [...values, employeeId, discountId],
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
        [...values, discountId],
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

// STOCK
app.get("/stocks", async (req, res) => {
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

app.get("/stock-history", async (req, res) => {
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

app.get("/stock", async (req, res) => {
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
app.post("/stock", async (req, res) => {
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
      [stuff_id, imei_1, imei_2, sn],
    );

    let stuffInfoId = stuffInfoQuery.rows[0].stuff_information_id;

    // Insert into stock
    await store.query(
      `INSERT INTO stock (warehouse_id, stuff_id, stuff_information_id, stock_type)
       VALUES ($1, $2, $3, 'in')`,
      [warehouse_id, stuff_id, stuffInfoId],
    );

    // Update total_stock
    await store.query(
      `UPDATE stuff
       SET total_stock = (SELECT COUNT(*) FROM stuff_information WHERE stuff_id = $1 AND stock_status = 'ready')
       WHERE stuff_id = $2`,
      [stuff_id, stuff_id],
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

app.post("/upload-stock", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: 400,
      message: "File not found",
    });
  }

  const filePath = req.file.path;
  const ext = req.file.originalname.split(".").pop().toLowerCase();

  let rows = [];

  try {
    if (ext === "csv") {
      rows = await parseCSV(filePath);
    } else if (ext === "xlsx" || ext === "xls") {
      rows = parseExcel(filePath);
    } else {
      throw new Error("File format must be csv or excel");
    }

    if (!rows || rows.length === 0) {
      throw new Error("Empty file or invalid format");
    }

    await store.query("BEGIN");

    for (let i = 0; i < rows.length; i++) {
      let item = rows[i];

      for (let key in item) {
        if (typeof item[key] === "string") {
          item[key] = item[key].trim().toLowerCase();
        }
      }

      let { warehouse_name, stuff_name, imei_1, imei_2, sn } = item;

      if (!warehouse_name || !stuff_name) {
        throw new Error(`Invalid row at line ${i + 1}`);
      }

      const warehouseQuery = await store.query(
        `
          SELECT warehouse_id
          FROM warehouse
          WHERE LOWER(TRIM(warehouse_name)) = LOWER(TRIM($1))
          `,
        [warehouse_name],
      );

      if (warehouseQuery.rows.length === 0) {
        throw new Error(`Warehouse "${warehouse_name}" not registered`);
      }

      const warehouseId = Number(warehouseQuery.rows[0].warehouse_id);

      const stuffQuery = await store.query(
        `
          SELECT stuff_id
          FROM stuff
          WHERE LOWER(stuff_name) = $1
          `,
        [stuff_name],
      );

      if (stuffQuery.rows.length === 0) {
        throw new Error(`Stuff "${stuff_name}" not registered`);
      }

      const stuffId = Number(stuffQuery.rows[0].stuff_id);

      const stuffInfoQuery = await store.query(
        `
          INSERT INTO stuff_information
          (stuff_id, imei_1, imei_2, sn, stock_status)
          VALUES
          ($1::int, $2, $3, $4, 'ready')
          RETURNING stuff_information_id
          `,
        [stuffId, imei_1 || null, imei_2 || null, sn || null],
      );

      const stuffInformationId = Number(
        stuffInfoQuery.rows[0].stuff_information_id,
      );

      await store.query(
        `
          INSERT INTO stock
          (warehouse_id, stuff_id, stuff_information_id, stock_type)
          VALUES
          ($1::int, $2::int, $3::int, 'in')
          `,
        [warehouseId, stuffId, stuffInformationId],
      );

      await store.query(
        `
          UPDATE stuff
          SET total_stock = (
            SELECT COUNT(*)::int
            FROM stuff_information
            WHERE stuff_id = $1::int
              AND stock_status = 'ready'
          )
          WHERE stuff_id = $1::int
          `,
        [stuffId],
      );
    }

    await store.query("COMMIT");

    return res.status(201).json({
      status: 201,
      message: "Success upload stock",
    });
  } catch (err) {
    await store.query("ROLLBACK");
    console.log(err);
    return res.status(500).json({
      status: 500,
      message: err.message || "Internal server error",
    });
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// CUSTOMER ORDER
app.get("/customer-orders", async (req, res) => {
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

app.get("/customer-order-detail/:order_id", async (req, res) => {
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
      [reqId],
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

app.get("/customer-order", async (req, res) => {
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

app.post("/customer-order", async (req, res) => {
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
      }, {}),
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
      [stuff_id],
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
        [d.discount_id],
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
        [item.stuff_id, id.value],
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
      [account.id],
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
      ],
    );

    let orderId = orderQuery.rows[0].order_id;

    for (let d of discounts || []) {
      await store.query(
        "INSERT INTO order_discount (order_id, discount_id) VALUES ($1,$2)",
        [orderId, d.discount_id],
      );
    }

    for (let item of items) {
      let { stuff_information_id } = await verifyAndGetStuffInfo(item);

      await store.query(
        `INSERT INTO stock (warehouse_id, stuff_id, stuff_information_id, stock_type)
         VALUES ($1,$2,$3,'out')`,
        [warehouse_id, item.stuff_id, stuff_information_id],
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
        ],
      );

      await store.query(
        `UPDATE stuff_information
         SET stock_status = 'sold'
         WHERE stuff_information_id = $1`,
        [stuff_information_id],
      );
    }

    for (let q of quantities) {
      let stockQuery = await store.query(
        "SELECT total_stock FROM stuff WHERE stuff_id = $1 FOR UPDATE",
        [q.stuff_id],
      );

      if (stockQuery.rows[0].total_stock < q.quantity)
        throw new Error("Stock insufficient");

      await store.query(
        "UPDATE stuff SET total_stock = total_stock - $1 WHERE stuff_id = $2",
        [q.quantity, q.stuff_id],
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
app.listen(BACKEND_PORT, () => {
  console.log(`Server running on port ${BACKEND_PORT}`);
});
