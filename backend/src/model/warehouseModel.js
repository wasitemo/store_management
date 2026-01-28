import store from "../config/store.js";

// MAIN QUERY
async function getWarehouse(limit, offset) {
  const query = await store.query(
    `
        SELECT
        warehouse_id,
        warehouse_name,
        warehouse_address
        FROM warehouse
        GROUP BY warehouse_id
        LIMIT $1 OFFSET $2 
    `,
    [limit, offset],
  );
  const result = query.rows;

  return result;
}

async function getWarehouseById(warehouseId) {
  const query = await store.query(
    `
        SELECT
        warehouse_id,
        warehouse_name,
        warehouse_address
        FROM warehouse
        WHERE warehouse_id = $1
    `,
    [warehouseId],
  );
  const result = query.rows[0];

  return result;
}

async function addWarehouse(warehouseName, warehouseAddress) {
  await store.query(
    `
        INSERT INTO warehouse
        (warehouse_name, warehouse_address)
        VALUES
        ($1, $2)    
    `,
    [warehouseName, warehouseAddress],
  );
}

async function updateWarehouse(data, warehouseId) {
  const { warehouse_name, warehouse_address } = data;
  await store.query(
    `
        UPDATE warehouse
        SET
        warehouse_name = $1,
        warehouse_address = $2
        WHERE warehouse_id = $3    
    `,
    [warehouse_name, warehouse_address, warehouseId],
  );
}

async function findWarehouseIdByName(warehouseName) {
  const query = await store.query(
    "SELECT warehouse_id FROM warehouse WHERE LOWER(TRIM(warehouse_name)) = LOWER(TRIM($1))",
    [warehouseName],
  );
  const result = query.rows[0];

  return result;
}

// UTIL QUERY
async function getTotalWarehouse() {
  const query = await store.query("SELECT COUNT(warehouse_id) FROM warehouse");
  const result = query.rows[0];

  return result;
}
export {
  getWarehouse,
  getWarehouseById,
  getTotalWarehouse,
  findWarehouseIdByName,
  addWarehouse,
  updateWarehouse,
};
