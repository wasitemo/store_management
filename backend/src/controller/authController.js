import ErrorMessage from "../error/ErrorMessage.js";
import {
  showAccount,
  showAccountById,
  showTotalAccount,
  showEmployeeName,
  register,
  login,
  refresh,
  editAccount,
  logout,
} from "../service/authService.js";

async function presentAccount(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let offset = (page - 1) * limit;
    let total = await showTotalAccount();
    const result = await showAccount(limit, offset);

    return res.status(200).json({
      status: 200,
      page,
      limit,
      total_data: parseInt(total.count),
      total_page: Math.ceil(total.count / limit),
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function presentAccountById(req, res, next) {
  try {
    let accountId = parseInt(req.params.employee_account_id);
    const result = await showAccountById(accountId);

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function presentEmployeeName(req, res, next) {
  try {
    const result = await showEmployeeName();
    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    console.log(err);
  }
}

async function registerAccount(req, res, next) {
  try {
    let { employee_id, username, password, role, account_status } = req.body;

    if (!employee_id) {
      throw new ErrorMessage("Missing required key: employee_id", 400);
    }

    if (!username) {
      throw new ErrorMessage("Missing required key: username", 400);
    }

    if (!password) {
      throw new ErrorMessage("Missing required key: password", 400);
    }

    if (!role) {
      throw new ErrorMessage("Missing required key: role", 400);
    }

    if (!account_status) {
      throw new ErrorMessage("Missing required key: account_status", 400);
    }

    employee_id = parseInt(employee_id);
    username = username.trim();
    password = password.trim();
    role = role.toLowerCase().trim();
    account_status = account_status.toLowerCase().trim();

    await register(employee_id, username, password, role, account_status);
    return res.status(201).json({
      status: 201,
      message: "Register account success",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function loginAccount(req, res, next) {
  try {
    let { username, password } = req.body;

    if (!username) {
      throw new ErrorMessage("Missing required key: username", 400);
    }

    if (!password) {
      throw new ErrorMessage("Missing required key: password", 400);
    }

    username = username.trim();
    password = password.trim();

    const { refresh_token, access_token } = await login(username, password);
    res.cookie("refreshToken", refresh_token, {
      httpOnly: true,
      secure: false,
      samesite: "lax",
      maxAge: parseInt(process.env.MAX_AGE_COOKIE),
    });

    return res.status(200).json({
      status: 200,
      access_token,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function refreshToken(req, res, next) {
  try {
    const token = req.cookies.refreshToken;
    const newAccessToken = await refresh(token);

    return res.status(200).json({
      status: 200,
      new_access_token: newAccessToken,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function changeAccount(req, res, next) {
  try {
    let accountId = parseInt(req.params.employee_account_id);
    let updateData = req.body;
    let fields = [
      "employee_id",
      "username",
      "password",
      "role",
      "account_status",
    ];
    let invalidField = Object.keys(updateData).filter(
      (k) => !fields.includes(k),
    );

    if (invalidField.length > 0) {
      throw new ErrorMessage(
        `Missing required key: ${invalidField.join(", ")}`,
      );
    }

    for (let k in updateData) {
      if (typeof updateData[k] === "string") {
        updateData[k] = updateData[k].trim();
      }

      if (k === "role") {
        updateData[k] = updateData[k].toLowerCase();
      }

      if (k === "account_status") {
        updateData[k] = updateData[k].toLowerCase();
      }
    }

    await editAccount(updateData, accountId);
    return res.status(200).json({
      status: 200,
      message: "Success updated employee account",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function logoutAccount(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (req.cookies.refreshToken) {
      res.clearCookie("refreshToken");
    }

    await logout(refreshToken);
    return res.status(201).json({
      status: 201,
      message: "Logout success",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export {
  presentAccount,
  presentAccountById,
  presentEmployeeName,
  registerAccount,
  loginAccount,
  refreshToken,
  changeAccount,
  logoutAccount,
};
