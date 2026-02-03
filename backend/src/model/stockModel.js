import store from "../config/store.js";

// MAIN QUERY
async function getStock(limit, offset) {
  const query = await store.query(
    `
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
      ORDER BY w.warehouse_id ASC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );
  const result = query.rows;

  return result;
}

async function getStockHistory(limit, offset) {
  const query = await store.query(
    `
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
      ORDER BY stock.stock_id ASC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );
  const result = query.rows;

  return result;
}

async function addStock(warehouseId, stuffId, stuffInfoId) {
  await store.query(
    `
        INSERT INTO stock
        (warehouseId, stuff_id, stuff_information_id, stock_type)
        VALUES
        ($1, $2, $3, "in")
    `[(warehouseId, stuffId, stuffInfoId)],
  );
}

// UTIL QUERY
async function getTotalStock() {
  const query = await store.query(
    `
        SELECT COUNT(*)
            FROM (
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
            );
    `,
  );
  const result = query.rows[0];

  return result;
}

async function getTotalStockHistory() {
  const query = await store.query(`
        SELECT COUNT(*)
            FROM 
            (
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
            );    
    `);
  const result = query.rows[0];

  return result;
}

export {
  getStock,
  getStockHistory,
  getTotalStock,
  getTotalStockHistory,
  addStock,
};
