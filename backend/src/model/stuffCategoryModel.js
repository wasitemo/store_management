import store from "../config/store.js";

// MAIN QUERY
async function getStuffCategory(limit, offset) {
  const query = await store.query(
    `
        SELECT
        stuff_category_id,
        stuff_category_name
        FROM stuff_category
        ORDER BY stuff_category_id ASC
        LIMIT $1 OFFSET $2    
    `,
    [limit, offset]
  );
  const result = query.rows;

  return result;
}

async function getStuffCategoryById(stuffCategoryId) {
  const query = await store.query(
    `
        SELECT
        stuff_category_id,
        stuff_category_name
        FROM stuff_category
        WHERE stuff_category_id = $1
    `,
    [stuffCategoryId]
  );
  const result = query.rows;

  return result;
}

async function addStuffCategory(stuffCategoryName) {
  await store.query(
    `
        INSERT INTO stuff_category
        (stuff_category_name)
        VALUES
        ($1)    
    `,
    [stuffCategoryName]
  );
}

async function updateStuffCategory(stuffCategoryName, stuffCategoryId) {
  await store.query(
    `
        UPDATE stuff_category
        SET
        stuff_category_name = $1
        WHERE stuff_category_id = $2
    `,
    [stuffCategoryName, stuffCategoryId]
  );
}

// UTIL QUERY
async function getTotalStuffCategory() {
  const query = await store.query(
    "SELECT COUNT(stuff_category_id) FROM stuff_category"
  );
  const result = query.rows[0];

  return result;
}

export {
  getStuffCategory,
  getStuffCategoryById,
  getTotalStuffCategory,
  addStuffCategory,
  updateStuffCategory,
};
