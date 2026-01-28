import store from "../config/store.js";

// MAIN QUERY
async function getStuffPurchase(limit, offset) {
  const query = await store.query(
    `
      SELECT
        stuff_purchase.stuff_purchase_id,
        supplier.supplier_name,
        employee.employee_name,
        stuff_purchase.buy_date,
        stuff_purchse.total_price
      FROM stuff_purchase
      LEFT JOIN supplier ON supplier.supplier_id = sp.supplier_id
      LEFT JOIN employee ON employee.employee_id = sp.employee_id
      ORDER BY sp.stuff_purchase_id ASC
      LIMIT = $1 OFFSET $2
    `,
    [limit, offset],
  );
  const result = query.rows;

  return result;
}

async function getStuffPurchaseById(stuffPurchaseId) {
  const query = await store.query(
    `
        SELECT
          stuff_purchase.stuff_purchase_id,
          supplier.supplier_name,
          employee.employee_name,
          warehouse.warehouse_name,
          stuff.stuff_name,
          stuff_purchase_detail.buy_batch,
          stuff_purchase.buy_date,
          stuff_purchase_detail.quantity,
          stuff_purchase_detail.buy_price,
          stuff_purchase.total_price
        FROM stuff_purchase
        LEFT JOIN supplier ON supplier.supplier_id = stuff_purchase.supplier_id
        LEFT JOIN employee ON employee.employee_id = stuff_purchase.employee_id
        LEFT JOIN stuff_purchase_detail 
          ON stuff_purchase_detail.stuff_purchase_id = stuff_purchase.stuff_purchase_id
        LEFT JOIN warehouse ON warehouse.warehouse_id = stuff_purchase_detail.warehouse_id
        LEFT JOIN stuff stuff ON stuff.stuff_id = stuff_purchase_detail.stuff_id
        WHERE stuff_purchase.stuff_purchase_id = $1
      `,
    [stuffPurchaseId],
  );
  const result = query.rows[0];

  return result;
}

async function addStuffPurchase(supplierId, employeeId, buyDate, totalPrice) {
  const query = await store.query(
    `
        INSERT INTO stuff_purchase
        (supplier_id, employee_id, buy_date, total_price)
        VALUES
        ($1, $2, $3, $4)
        RETURNING stuff_purchase.stuff_purchase_id    
    `,
    [supplierId, employeeId, buyDate, totalPrice],
  );
  const result = query.rows[0];

  return result;
}

export { getStuffPurchase, getStuffPurchaseById, addStuffPurchase };
