import store from "../config/store.js";

// MAIN QUERY
async function getOrder(limit, offset) {
  let query = await store.query(
    `
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
      ORDER BY customer_order.order_id ASC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );
  let result = query.rows;

  return result;
}

async function addOrder(
  customerId,
  paymentMethodId,
  employeeId,
  orderDate,
  payment,
  subTotal,
  remainingPayment,
) {
  const query = await store.query(
    `
        INSERT INTO customer_order
        (customer_id, payment_method_id, employee_id, order_date, payment, sub_total, remaining_payment)
        VALUES
        ($1, $2, $3, $4, $5, $6, $7)
        RETURNING customer_order.order_id    
    `,
    [
      customerId,
      paymentMethodId,
      employeeId,
      orderDate,
      payment,
      subTotal,
      remainingPayment,
    ],
  );
  const result = query.rows[0];

  return result;
}

// UTIL QUERY
async function getTotalOrder() {
  const query = await store.query(`
        SELECT COUNT(*)
        FROM (
            SELECT
            customer_order.order_id
            FROM customer_order
            LEFT JOIN customer ON customer.customer_id = customer_order.customer_id
            LEFT JOIN payment_method ON payment_method.payment_method_id = customer_order.payment_method_id
            LEFT JOIN employee ON employee.employee_id = customer_order.employee_id
        )    
    `);
  const result = query.rows[0];

  return result;
}

export { getOrder, getTotalOrder, addOrder };
