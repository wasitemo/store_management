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
import paymentMethodRoute from "./src/route/paymentMethodRoute.js";
import discountRoute from "./src/route/discountRoute.js";
import stockRoute from "./src/route/stockRoute.js";

const app = express();
const BACKEND_PORT = process.env.BACKEND_PORT;

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
app.use("/", paymentMethodRoute);
app.use("/", discountRoute);
app.use("/", stockRoute);

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
