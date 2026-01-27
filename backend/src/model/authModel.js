import store from "../config/store.js";

// MAIN QUERY
async function getAccount(limit, offset) {
  const query = await store.query(
    `
        SELECT
        employee_account.employee_account_id,
        employee.employee_id,
        employee_name,
        username,
        role,
        account_status
        FROM employee_account
        INNER JOIN employee ON employee_account.employee_id = employee.employee_id
        ORDER BY employee_account_id ASC
        LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );
  const result = query.rows;

  return result;
}

async function getAccountById(accountId) {
  const query = await store.query(
    `
        SELECT
        employee_account.employee_account_id,
        employee.employee_id,
        employee_name,
        username,
        password,
        role,
        account_status
        FROM employee_account
        INNER JOIN employee ON employee_account.employee_id = employee.employee_id
        WHERE employee_account.employee_account_id = $1
    `,
    [accountId],
  );
  const result = query.rows[0];

  return result;
}

async function addAccount(employeeId, username, password, role, accountStatus) {
  await store.query(
    `
        INSERT INTO employee_account
        (
            employee_id,
            username,
            password,
            role,
            account_status
        )
        VALUES
        (
            $1,
            $2,
            $3,
            $4,
            $5,
        )
    `,
    [employeeId, username, password, role, accountStatus],
  );
}

async function updateAccount(data, accountId) {
  const { employe_id, username, password, role, account_status } = data;
  await store.query(
    `
        UPDATE employee_account
        SET
        employee_id = $1,    
        username = $2,    
        password = $3,    
        role = $4,    
        account_status = $5,
        WHERE employee_account_id = $6    
    `,
    [employe_id, username, password, role, account_status, accountId],
  );
}

// UTIL QUERY
async function getTotalAccount() {
  const query = await store.query(
    "SELECT COUNT(employee_account_id) FROM employee_account",
  );
  const result = query.rows[0];

  return result;
}

async function findAccountByUsername(username) {
  const query = await store.query(
    "SELECT employee_id, username FROM employee_account WHERE LOWER(TRIM(username)) = LOWER(TRIM($1))",
    [username],
  );
  const result = query.rows[0];

  return result;
}

async function findPasswordByUsername(username) {
  const query = await store.query(
    "SELECT password FROM employee_account WHERE LOWER(TRIM(username)) = LOWER(TRIM($1))",
    [username],
  );
  const result = query.rows[0];

  return result;
}

async function findAccountStatusByUsername(username) {
  const query = await store.query(
    "SELECT account_status FROM employee_account WHERE LOWER(TRIM(username)) = LOWER(TRIM($1))",
    [username],
  );
  const result = query.rows[0];

  return result;
}

export {
  getAccount,
  getAccountById,
  getTotalAccount,
  addAccount,
  updateAccount,
  findAccountByUsername,
  findPasswordByUsername,
  findAccountStatusByUsername,
};
