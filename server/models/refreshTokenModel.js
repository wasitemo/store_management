import db from "../config/db.js";

export const saveRefreshToken = async (employee_account_id, token, expiresAt) => {
    await db.execute("INSERT INTO refresh_token (employee_account_id, token, expires_at, created_at) VALUES ($1, $2, $3, NOW())", [employee_account_id, token, expiresAt]);
};

export const findRefreshToken = async (token) => { 
    const rows = await db.execute("SELECT * FROM refresh_token WHERE token = $1 AND revoked = 0", [token]);

    return rows[0];
};

export const revokedToken = async (token) => { 
    await db.execute("UPDATE refresh_token SET revoked = 1 WHERE token = $1", [token]);
};