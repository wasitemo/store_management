import store from "../config/store.js";

// MAIN QUERY
async function getImeiSn(limit, offset) {
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
        ORDER BY stuff_information_id
        LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );
  let result = query.rows;

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

// UTIL QUERY
async function getTotalImeiSn() {
  const query = await store.query(
    "SELECT COUNT(stuff_information_id) FROM stuff_information",
  );
  const result = query.rows[0];

  return result;
}

export { getImeiSn, getValidImeiSn, getTotalImeiSn };
