import store from "../config/store.js";

// MAIN QUERY
async function addStuffInformation(stuffId, imei1, imei2, sn) {
  const query = await store.query(
    `
        INSERT INTO stuff_information
        (stuff_id, imei_1, imei_2, sn, stock_status)
        VALUES
        ($1, $2, $3, $4, 'ready') 
        RETURNING stuff_information_id
    `,
    [stuffId, imei1, imei2, sn],
  );
  const result = query.rows[0];

  return result;
}

// UTIL QUERY
async function findImei1(imei1) {
  const query = await store.query(
    "SELECT imei_1 FROM stuff_information WHERE LOWER(TRIM(imei_1)) = LOWER(TRIM($1))",
    [imei1],
  );
  const result = query.rows[0];

  return result;
}

async function findImei2(imei2) {
  const query = await store.query(
    "SELECT imei_2 FROM stuff_information WHERE LOWER(TRIM(imei_2)) = LOWER(TRIM($1))",
    [imei2],
  );
  const result = query.rows[0];

  return result;
}

async function findSn(sn) {
  const query = await store.query(
    "SELECT sn FROM stuff_information WHERE LOWER(TRIM(sn)) = LOWER(TRIM($1))",
    [sn],
  );
  const result = query.rows[0];

  return result;
}

export { findImei1, findImei2, findSn, addStuffInformation };
