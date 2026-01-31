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
        stuff_purchase.total_price
        FROM stuff_purchase
        LEFT JOIN supplier ON supplier.supplier_id = stuff_purchase.supplier_id
        LEFT JOIN employee ON employee.employee_id = stuff_purchase.employee_id
        ORDER BY stuff_purchase.stuff_purchase_id ASC
        LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );
  const result = query.rows;

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

// UTIL QUERY
async function getTotalStuffPurchase() {
  const query = await store.query(
    "SELECT COUNT(stuff_purchase_id) FROM stuff_purchase",
  );
  const result = query.rows[0];

  return result;
}

export { getStuffPurchase, addStuffPurchase, getTotalStuffPurchase };
