import store from "../config/store.js";

// MAIN QUERY
async function getSupplier(limit, offset) {
  const query = await store.query(
    `
        SELECT
        supplier_id,
        supplier_name,
        supplier_contact,
        supplier_address
        FROM supplier
        ORDER BY supplier_id ASC
        LIMIT $1 OFFSET $2    
    `,
    [limit, offset]
  );
  const result = query.rows;

  return result;
}

async function getSupplierById(supplierId) {
  const query = await store.query(
    `
        SELECT
        supplier_id,
        supplier_name,
        supplier_contact,
        supplier_address
        FROM supplier
        WHERE supplier_id = $1
    `,
    [supplierId]
  );
  const result = query.rows[0];

  return result;
}

async function addSupplier(supplierName, supplierContact, supplierAddress) {
  await store.query(
    `
        INSERT INTO supplier
        (supplier_name, supplier_contact, supplier_address)
        VALUES
        ($1, $2, $3)    
    `,
    [supplierName, supplierContact, supplierAddress]
  );
}

async function updateSupplier(data, supplierId) {
  const { supplier_name, supplier_contact, supplier_address } = data;

  await store.query(
    `
        UPDATE supplier
        SET
        supplier_name = $1,
        supplier_contact = $2,
        supplier_address = $3
        WHERE supplier_id = $4    
    `,
    [supplier_name, supplier_contact, supplier_address, supplierId]
  );
}

// UTIL QUERY
async function getTotalSupplier() {
  const query = await store.query("SELECT COUNT(supplier_id) FROM supplier");
  const result = query.rows[0];

  return result;
}

export {
  getSupplier,
  getSupplierById,
  getTotalSupplier,
  addSupplier,
  updateSupplier,
};
