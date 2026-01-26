import store from "../config/store.js";

// MAIN QUERY
async function addRefreshToken(accountId, token) {
  await store.query(
    `
        INSERT INTO refresh_token
        (employee_account_id, token)
        VALUES
        ($1, $2)    
    `,
    [accountId, token],
  );
}

async function deleteRefreshToken(token) {
  await store.query("DELETE FROM refresh_token WHERE token = $1", [token]);
}

// UTIL QUERY
async function findRefreshToken(token) {
  const query = await store.query(
    "SELECT token FROM refresh_token WHERE token = $1",
    [token],
  );
  const result = query.rows[0];

  return result;
}

export { findRefreshToken, addRefreshToken, deleteRefreshToken };
