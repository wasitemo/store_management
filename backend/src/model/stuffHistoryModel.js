import store from "../config/store.js";

// MAIN QUERY
async function getStuffHistory(limit, offset) {
  const query = await store.query(
    `
        SELECT
        stuff_history.stuff_history_id,
        employee.employee_id,
        stuff.stuff_id,
        employee.employee_name,
        stuff.stuff_name,
        operation,
        change_at,
        old_data,
        new_data
        FROM stuff_history
        LEFT JOIN employee ON employee.employee_id = stuff_history.employee_id
        LEFT JOIN stuff ON stuff.stuff_id = stuff_history.stuff_id
        ORDER BY stuff_history.stuff_history_id ASC
        LIMIT $1 OFFSET $2
    `,
    [limit, offset],
  );
  const result = query.rows;

  return result;
}

async function addStuffHistory(stuffId, employeeId, newData) {
  await store.query(
    `
        INSERT INTO stuff_history
        (
            stuff_id,
            employee_id,
            operation,
            new_data
        )
        VALUES
        (
            $1,
            $2,
            $3,
            $4
        )
    `,
    [stuffId, employeeId, "insert", newData],
  );
}

async function updateStuffHistory(stuffId, employeeId, oldData, newData) {
  await store.query(
    `
        INSERT stuff_history
        (
            stuff_id,
            employee_id,
            "update",
            old_data,
            new_data
        )
        VALUES
        (
            $1,
            $2,
            $3,
            $4,
            $5
        )
    `,
    [stuffId, employeeId, oldData, newData],
  );
}

// UTIL QUERY
async function getTotalStuffHistory() {
  const query = store.query(
    "SELECT COUNT(stuff_history_id) FROM stuff_history",
  );
  const result = (await query).rows[0];

  return result;
}

export {
  getStuffHistory,
  getTotalStuffHistory,
  addStuffHistory,
  updateStuffHistory,
};
