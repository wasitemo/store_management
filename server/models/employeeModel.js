import db from "../config/db.js";

export const findUserByUsername = async (username) => {
    const rows = await db.execute("SELECT * FROM employee_account WHERE username = $1", [username]);

    return rows[0];
};

export const createAccount = async (employee_id, username, password, role) => {
    await db.execute("INSERT INTO employee_account (employee_id, username, password, role) VALUES ($1, $2, $3, $4)", [employee_id, username, password, role]);
};