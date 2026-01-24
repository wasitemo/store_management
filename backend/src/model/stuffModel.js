import store from "../config/store.js";

// MAIN QUERY
async function getStuff(limit, offset) {
  const query = await store.query(
    `
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
      ORDER BY stuff.stuff_id ASC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );
  let result = query.rows;

  return result;
}

async function getStuffByStuffId(stuffId) {
  let query = await store.query(
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
    [stuffId],
  );
  const result = query.rows[0];

  return result;
}

async function getValidImeiSn(warehouseId, identify) {
  const query = await store.query(
    `
        SELECT
        s.stuff_id,
        s.stuff_name,
        s.stuff_variant,
        s.current_sell_price,
        s.has_sn,
        s.barcode,
        s.total_stock,
        w.warehouse_id,
        w.warehouse_name,
        si.stuff_information_id,
        si.imei_1,
        si.imei_2,
        si.sn,
        CASE
          WHEN LOWER(TRIM(si.imei_1)) = $2 THEN 'imei_1'
          WHEN LOWER(TRIM(si.imei_2)) = $2 THEN 'imei_2'
          WHEN LOWER(TRIM(si.sn)) = $2 THEN 'sn'
          WHEN LOWER(TRIM(s.barcode)) = $2 THEN 'barcode'
        END AS matched_by
      FROM stuff_information si
      JOIN stuff s
        ON s.stuff_id = si.stuff_id
      JOIN stock st
        ON st.stuff_information_id = si.stuff_information_id
      JOIN warehouse w
        ON w.warehouse_id = st.warehouse_id
      WHERE w.warehouse_id = $1
        AND (
          LOWER(TRIM(si.imei_1)) = $2 OR
          LOWER(TRIM(si.imei_2)) = $2 OR
          LOWER(TRIM(si.sn)) = $2 OR
          LOWER(TRIM(s.barcode)) = $2
        )
      LIMIT 1
    `,
    [warehouseId, identify],
  );
  const result = query.rows;

  return result;
}

async function getImeiSn() {
  const query = await store.query(
    `
        SELECT DISTINCT
        stuff_information.stuff_information_id,
        stuff_name,
        warehouse_name,
        imei_1,
        imei_2,
        sn,
        stock_status
        FROM stuff_information
        INNER JOIN stuff ON stuff.stuff_id = stuff_information.stuff_id
        INNER JOIN stock ON stock.stuff_information_id = stuff_information.stuff_information_id
        INNER JOIN warehouse ON warehouse.warehouse_id = stock.warehouse_id
        WHERE imei_1 IS NOT NULL OR imei_2 IS NOT NULL OR sn IS NOT NULL
    `,
  );
  let result = query.rows;

  return result;
}

async function getStuffHistory() {
  const query = await store.query(`
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
  const result = query.rows;

  return result;
}

async function addStuff(data) {
  const {
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
  } = data;
  await store.query(
    `
        INSERT INTO stuff 
        (
            stuff_category_id, 
            stuff_brand_id, 
            supplier_id, 
            stuff_code, 
            stuff_sku, 
            stuff_name, 
            stuff_variant, 
            current_sell_price, 
            has_sn, 
            barcode
        )
        VALUES 
        (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10
        )
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
    ],
  );
}

async function updateStuff(data, stuffId) {
  const {
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
  } = data;

  await store.query(
    `
        UPDATE stuff
        SET
        stuff_category_id = $1,    
        stuff_brand_id = $2,    
        supplier_id = $3,    
        stuff_code = $4,    
        stuff_sku = $5,    
        stuff_name = $6,    
        stuff_variant = $7,    
        current_sell_price = $8,    
        has_sn = $9,    
        barcode = $10
        WHERE stuff_id = $11    
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
      stuffId,
    ],
  );
}

// UTIL QUERY
async function getTotalStuff() {
  let query = await store.query("SELECT COUNT(stuff_id) FROM stuff");
  let result = query.rows[0];

  return result;
}

export {
  getStuff,
  getStuffByStuffId,
  getImeiSn,
  getValidImeiSn,
  getStuffHistory,
  getTotalStuff,
  addStuff,
  updateStuff,
};
