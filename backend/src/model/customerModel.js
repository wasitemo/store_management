import store from "../config/store.js";

// MAIN QUERY
async function getCustomer(limit, offset) {
  const query = await store.query(
    `
        SELECT
        customer.customer_id,
        customer_name,
        customer_contact,
        customer_address
        FROM customer
        ORDER BY customer_id ASC
        LIMIT $1 OFFSET $2    
    `,
    [limit, offset],
  );
  const result = query.rows;

  return result;
}

async function getCustomerById(customerId) {
  const query = await store.query(
    `
        SELECT
        customer.customer_id,
        customer_name,
        customer_contact,
        customer_address
        FROM customer
        WHERE customer_id = $1
    `,
    [customerId],
  );
  const result = query.rows[0];

  return result;
}

async function addCustomer(customerName, customerContact, customerAddress) {
  await store.query(
    `
        INSERT INTO customer
        (customer_name, customer_contact, customer_address)
        VALUES
        ($1, $2, $3)    
    `,
    [customerName, customerContact, customerAddress],
  );
}

async function updateCustomer(data, customerId) {
  const { customer_name, customer_contact, customer_address } = data;

  await store.query(
    `
        UPDATE customer
        SET
        customer_name = $1,    
        customer_contact = $2,    
        customer_address = $3
        WHERE customer_id = $4    
    `,
    [customer_name, customer_contact, customer_address, customerId],
  );
}

// UTIL QUERY
async function getTotalCustomer() {
  const query = await store.query(`
    SELECT COUNT(*)
    FROM (
      SELECT
      customer.customer_id,
      customer_name,
      customer_contact,
      customer_address
      FROM customer
      ORDER BY customer_id ASC
    )  
  `);
  const result = query.rows[0];

  return result;
}

async function getCustomerIdAndName() {
  const query = await store.query(
    "SELECT customer_id, customer_name FROM customer",
  );
  const result = query.rows;

  return result;
}

export {
  getCustomer,
  getCustomerById,
  getTotalCustomer,
  getCustomerIdAndName,
  addCustomer,
  updateCustomer,
};
