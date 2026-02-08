import store from "../config/store.js";

// MAIN QUERY
async function getPaymentMethod(limit, offset) {
  const query = await store.query(
    `
        SELECT
        payment_method_id,
        payment_method_name
        FROM payment_method
        ORDER BY payment_method_id ASC
        LIMIT $1 OFFSET $2    
    `,
    [limit, offset],
  );
  const result = query.rows;

  return result;
}

async function getPaymentMethodById(paymentMethodId) {
  const query = await store.query(
    `
        SELECT
        payment_method_id,
        payment_method_name
        FROM payment_method
        WHERE payment_method_id = $1
    `,
    [paymentMethodId],
  );
  const result = query.rows[0];

  return result;
}

async function addPaymentMethod(paymentMethodName) {
  await store.query(
    `
        INSERT INTO payment_method
        (payment_method_name)
        VALUES
        ($1)    
    `,
    [paymentMethodName],
  );
}

async function updatePaymentMethod(paymentMethodName, paymentMethodId) {
  await store.query(
    `
        UPDATE payment_method
        SET
        payment_method_name = $1
        WHERE payment_method_id = $2    
    `,
    [paymentMethodName, paymentMethodId],
  );
}

// UTIL QUERY
async function getTotalPaymentMethod() {
  const query = await store.query(`
        SELECT COUNT(*)
        FROM (
          SELECT
          payment_method_id,
          payment_method_name
          FROM payment_method
          ORDER BY payment_method_id ASC
        )    
    `);
  const result = query.rows[0];

  return result;
}

async function getPaymentMethodIdAndName() {
  const query = await store.query(
    "SELECT payment_method_id, payment_method_name FROM payment_method",
  );
  const result = query.rows;

  return result;
}

export {
  getPaymentMethod,
  getPaymentMethodById,
  getTotalPaymentMethod,
  getPaymentMethodIdAndName,
  addPaymentMethod,
  updatePaymentMethod,
};
