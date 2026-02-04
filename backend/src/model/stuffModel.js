import store from "../config/store.js";

// MAIN QUERY
async function getStuff(limit, offset) {
  const query = await store.query(
    `
      SELECT DISTINCT 
      stuff.stuff_id,
      stuff.stuff_name,
      stuff_category.stuff_category_name,
      stuff_brand.stuff_brand_name,
      supplier.supplier_name,
      stuff.stuff_code,
      stuff.stuff_sku,
      stuff.stuff_variant,
      stuff.current_sell_price,
      stuff.barcode,
      stuff.has_sn
      FROM stuff
      LEFT JOIN stuff_category ON stuff.stuff_category_id = stuff_category.stuff_category_id
      LEFT JOIN stuff_brand ON stuff.stuff_brand_id = stuff_brand.stuff_brand_id
      LEFT JOIN supplier ON stuff.supplier_id = supplier.supplier_id
      ORDER BY stuff.stuff_id ASC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );
  let result = query.rows;

  return result;
}

async function getStuffByStuffId(stuffId) {
  let query = await store.query(
    `
      SELECT 
      stuff.stuff_id,
      stuff_category.stuff_category_id,
      stuff_brand.stuff_brand_id,
      supplier.supplier_id,
      stuff.stuff_name,
      stuff_category.stuff_category_name,
      stuff_brand.stuff_brand_name,
      supplier.supplier_name,
      stuff.stuff_code,
      stuff.stuff_sku,
      stuff.stuff_variant,
      stuff.barcode,
      stuff.has_sn,
      stuff.current_sell_price
      FROM stuff
      LEFT JOIN stuff_category ON stuff_category.stuff_category_id = stuff.stuff_category_id
      LEFT JOIN stuff_brand ON stuff_brand.stuff_brand_id = stuff.stuff_brand_id
      LEFT JOIN supplier ON supplier.supplier_id = stuff.supplier_id
      WHERE stuff_id = $1   
    `,
    [stuffId],
  );
  const result = query.rows[0];

  return result;
}

async function addStuff(
  stuffCategoryId,
  stuffBrandId,
  supplierId,
  stuffCode,
  stuffSku,
  stuffName,
  stuffVariant,
  currentSellPrice,
  hasSn,
  barcode,
) {
  const query = await store.query(
    `
        INSERT INTO stuff 
        (
            stuff_category_id, 
            stuff_brand_id, 
            supplier_id, 
            stuff_code, 
            stuff_sku, 
            stuff_name, 
            stuff_variant, 
            current_sell_price, 
            has_sn, 
            barcode
        )
        VALUES 
        (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10
        )
        RETURNING *
    `,
    [
      stuffCategoryId,
      stuffBrandId,
      supplierId,
      stuffCode,
      stuffSku,
      stuffName,
      stuffVariant,
      currentSellPrice,
      hasSn,
      barcode,
    ],
  );
  const result = query.rows[0];

  return result;
}

async function updateStuff(data, stuffId) {
  const {
    stuff_category_id,
    stuff_brand_id,
    supplier_id,
    stuff_code,
    stuff_sku,
    stuff_name,
    stuff_variant,
    current_sell_price,
    has_sn,
    barcode,
  } = data;

  const query = await store.query(
    `
        UPDATE stuff
        SET
        stuff_category_id = $1,    
        stuff_brand_id = $2,    
        supplier_id = $3,    
        stuff_code = $4,    
        stuff_sku = $5,    
        stuff_name = $6,    
        stuff_variant = $7,    
        current_sell_price = $8,    
        has_sn = $9,    
        barcode = $10
        WHERE stuff_id = $11
        RETURNING *
    `,
    [
      stuff_category_id,
      stuff_brand_id,
      supplier_id,
      stuff_code,
      stuff_sku,
      stuff_name,
      stuff_variant,
      current_sell_price,
      has_sn,
      barcode,
      stuffId,
    ],
  );
  const result = query.rows[0];

  return result;
}

async function updateTotalStock(stuffId1, stuffId2) {
  await store.query(
    `
    UPDATE stuff
    SET
    total_stock = (
      SELECT COUNT(*) FROM stuff_information WHERE stuff_id = $1 AND stock_status = 'ready'
    )
    WHERE stuff_id = $2  
  `,
    [stuffId1, stuffId2],
  );
}

// UTIL QUERY
async function getTotalStuff() {
  let query = await store.query("SELECT COUNT(stuff_id) FROM stuff");
  let result = query.rows[0];

  return result;
}

async function getStuffName() {
  const query = await store.query(
    "SELECT stuff_id, stuff_name FROM stuff ORDER BY stuff_id ASC",
  );
  const result = query.rows;

  return result;
}

async function findStuffIdByName(stuffName) {
  const query = await store.query(
    "SELECT stuff_id FROM stuff WHERE LOWER(TRIM(stuff_name)) = LOWER(TRIM($1))",
    [stuffName],
  );
  const result = query.rows[0];

  return result;
}

export {
  getStuff,
  getStuffByStuffId,
  getTotalStuff,
  getStuffName,
  findStuffIdByName,
  addStuff,
  updateStuff,
  updateTotalStock,
};
