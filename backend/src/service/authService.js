import bcrypt from "bcrypt";
import ErrorMessage from "../error/ErrorMessage.js";
import {
  getAccount,
  getAccountById,
  getTotalAccount,
  addAccount,
  updateAccount,
  findAccounByUsername,
  findPasswordByUsername,
  findAccountStatusByUsername,
} from "../model/authModel.js";
import {
  addRefreshToken,
  deleteRefreshToken,
  findRefreshToken,
} from "../model/refreshTokenModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../util/handleToken.js";

async function showAccount(limit, offset) {
  const result = await getAccount(limit, offset);
  if (result.length === 0) {
    throw new ErrorMessage("Employee account not found", 404);
  }

  return result;
}

async function showAccountById(accountId) {
  const result = await getAccountById(accountId);
  if (!result) {
    throw new ErrorMessage("Employee account not found", 404);
  }

  return result;
}

async function showTotalAccount() {
  const result = await getTotalAccount();
  if (!result) {
    throw new ErrorMessage("Account employee not found", 404);
  }

  return result;
}

async function register(employeeId, username, password, role, accountStatus) {
  const existingAccount = await findAccounByUsername(username);
  if (existingAccount) {
    throw new ErrorMessage("Username already registered", 409);
  }

  try {
    const hash = await bcrypt.hash(password, parseInt(process.env.SALT_ROUND));
    await addAccount(employeeId, username, hash, role, accountStatus);
  } catch (err) {
    console.log(`Error register: ${err}`);
    throw err;
  }
}

async function login(username, password) {
  const existingAccount = await findAccounByUsername(username);
  if (!existingAccount) {
    throw new ErrorMessage("Email not registered", 404);
  }

  const existingPassword = await findPasswordByUsername(username);
  if (!existingPassword) {
    throw new ErrorMessage("Password not registered", 404);
  }

  const isMatch = await bcrypt.compare(password, existingPassword.password);
  if (!isMatch) {
    throw new ErrorMessage("Account not registered", 404);
  }

  const accountStatus = await findAccountStatusByUsername(username);
  if (accountStatus.account_status === "non-active") {
    throw new ErrorMessage("You cannot access this account anymore", 401);
  }

  const payload = {
    id: existingAccount.employee_account_id,
    username: existingAccount.username,
  };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await addRefreshToken(existingAccount.employee_account_id, refreshToken);
  return { refresh_token: refreshToken, access_token: accessToken };
}

async function refresh(token) {
  const storedToken = await findRefreshToken(token);
  if (!storedToken) {
    throw new ErrorMessage("Refresh token not valid", 401);
  }

  const decoded = verifyRefreshToken(token);
  const newAccessToken = generateAccessToken({
    id: decoded.id,
    username: decoded.username,
  });

  return newAccessToken;
}

async function editAccount(data, accountId) {
  const existingAccount = await getAccountById(accountId);

  if (!existingAccount) {
    throw new ErrorMessage("Account employee not found", 404);
  }

  if (data === "password") {
    data.password = await bcrypt.hash(
      data.password,
      parseInt(process.env.SALT_ROUND),
    );
  }

  let updateData = {
    employee_id: data.employee_id ?? existingAccount.employee_id,
    username: data.username ?? existingAccount.username,
    password: data.password ?? existingAccount.password,
    role: data.role ?? existingAccount.role,
    account_status: data.account_status ?? existingAccount.account_status,
  };
  await updateAccount(updateData, accountId);
}

async function logout(token) {
  if (!token) {
    throw new ErrorMessage("Refresh token not valid", 401);
  }
  await deleteRefreshToken(token);
}

export {
  showAccount,
  showAccountById,
  showTotalAccount,
  register,
  login,
  refresh,
  editAccount,
  logout,
};
