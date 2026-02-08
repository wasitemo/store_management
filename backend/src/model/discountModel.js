import store from "../config/store.js";

// MAIN QUERY
async function getStuffDiscount(limit, offset) {
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
      GROUP BY stuff.stuff_id, stuff_name
      ORDER BY stuff.stuff_id ASC
      limit $1 OFFSET $2
    `,
    [limit, offset],
  );
  let result = query.rows;

  return result;
}

async function getStuffDiscountById(stuffId) {
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
    [stuffId],
  );
  const result = query.rows[0];

  return result;
}

async function getOrderDiscount(limit, offset) {
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
      ORDER BY discount_id ASC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );
  let result = query.rows;

  return result;
}

async function getOrderDiscountById(discountId) {
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
    [discountId],
  );
  let result = query.rows[0];

  return result;
}

async function addOrderDiscount(orderId, discountId) {
  await store.query(
    `
        INSERT INTO order_discount
        (order_id, discount_id)
        VALUES
        ($1, $2)    
    `,
    [orderId, discountId],
  );
}

async function addStuffDiscount(stuffId, discountId) {
  await store.query(
    `
        INSERT INTO stuff_discount
        (stuff_id, discount_id)
        VALUES
        ($1, $2)    
    `,
    [stuffId, discountId],
  );
}

async function updateStuffDiscount(stuffId, discountId) {
  await store.query(
    `
        UPDATE stuff_discount
        SET stuff_id = $1
        WHERE discount_id = $2    
    `,
    [stuffId, discountId],
  );
}

async function addDiscount(
  employeeId,
  discountName,
  discountType,
  discountValue,
  discountStart,
  discountEnd,
  discountStatus,
) {
  const query = await store.query(
    `
        INSERT INTO discount
        (
            employee_id,
            discount_name,
            discount_type,
            discount_value,
            started_time,
            ended_time,
            discount_status
        )
        VALUES
        ($1, $2, $3, $4, $5, $6, $7)
        RETURNING discount_id
    `,
    [
      employeeId,
      discountName,
      discountType,
      discountValue,
      discountStart,
      discountEnd,
      discountStatus,
    ],
  );
  const result = query.rows[0];

  return result;
}

async function updateDiscount(data, employeeId, discountId) {
  const {
    discount_name,
    discount_type,
    discount_value,
    discount_start,
    discount_end,
    discount_status,
  } = data;
  await store.query(
    `
        UPDATE discount
        SET
        employee_id = $1,
        discount_name = $2,
        discount_type = $3,
        discount_value = $4,
        started_time = $5,
        ended_time = $6,
        discount_status = $7
        WHERE discount_id = $8
    `,
    [
      employeeId,
      discount_name,
      discount_type,
      discount_value,
      discount_start,
      discount_end,
      discount_status,
      discountId,
    ],
  );
}

// UTIL QUERY
async function getTotalStuffDiscount() {
  const query = await store.query(`
    SELECT COUNT(*)
    FROM (
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
      ORDER BY stuff.stuff_id ASC
    )  
  `);
  const result = query.rows[0];

  return result;
}

async function getTotalOrderDiscount() {
  const query = await store.query(`
    SELECT COUNT(*)
    FROM (
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
      ORDER BY discount_id ASC
    )  
  `);
  const result = query.rows[0];

  return result;
}

async function getStuffPriceAndDiscount(stuffId) {
  const query = await store.query(
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
    [stuffId],
  );
  const result = query.rows[0];

  return result;
}

async function getDiscountIdAndName() {
  const query = await store.query(
    "SELECT discount_id, discount_name FROM discount",
  );
  const result = query.rows;

  return result;
}

async function getDiscountTypeStatusAndValueById(discountId) {
  const query = await store.query(
    `SELECT discount_type, discount_status, discount_value 
         FROM discount WHERE discount_id = $1`,
    [discountId],
  );
  const result = query.rows[0];

  return result;
}

export {
  getStuffDiscount,
  getStuffDiscountById,
  getOrderDiscount,
  getOrderDiscountById,
  getTotalStuffDiscount,
  getTotalOrderDiscount,
  getDiscountIdAndName,
  getStuffPriceAndDiscount,
  getDiscountTypeStatusAndValueById,
  addOrderDiscount,
  addStuffDiscount,
  addDiscount,
  updateStuffDiscount,
  updateDiscount,
};
