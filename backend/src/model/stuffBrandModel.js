import store from "../config/store.js";

// MAIN QUERY
async function getStuffBrand(limit, offset) {
  const query = await store.query(
    `
        SELECT
        stuff_brand_id,
        stuff_brand_name
        FROM stuff_brand
        ORDER BY stuff_brand_id ASC
        LIMIT $1 OFFSET $2    
    `,
    [limit, offset],
  );
  const result = query.rows;

  return result;
}

async function getStuffBrandById(stuffBrandId) {
  const query = await store.query(
    `
        SELECT
        stuff_brand_id,
        stuff_brand_name
        FROM stuff_brand
        WHERE stuff_brand_id = $1
    `,
    [stuffBrandId],
  );
  const result = query.rows[0];

  return result;
}

async function getStuffBrandName() {
  const query = await store.query("SELECT stuff_brand_name FROM stuff_brand");
  const result = query.rows;

  return result;
}

async function addStuffBrand(stuffBrandName) {
  await store.query(
    `
        INSERT INTO stuff_brand
        (stuff_brand_name)
        VALUES
        ($1)    
    `,
    [stuffBrandName],
  );
}

async function updateStuffBrand(stuffBrandName, stuffBrandId) {
  await store.query(
    `
        UPDATE stuff_brand
        SET
        stuff_brand_name = $1
        WHERE stuff_brand_id = $2
    `,
    [stuffBrandName, stuffBrandId],
  );
}

// UTIL QUERY
async function getTotalStuffBrand() {
  const query = await store.query(
    "SELECT COUNT(stuff_brand_id) FROM stuff_brand",
  );
  const result = query.rows[0];

  return result;
}

export {
  getStuffBrand,
  getStuffBrandById,
  getStuffBrandName,
  getTotalStuffBrand,
  addStuffBrand,
  updateStuffBrand,
};
