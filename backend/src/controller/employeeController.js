import ErrorMessage from "../error/ErrorMessage.js";
import {
  showEmployee,
  showEmployeeById,
  showTotalEmployee,
  newEmployee,
  editEmployee,
} from "../service/employeeService.js";

async function presentEmployee(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let offset = (page - 1) * limit;
    let total = await showTotalEmployee();
    const result = await showEmployee(limit, offset);
    return res.status(200).json({
      status: 200,
      page,
      limit,
      total_data: parseInt(total.count),
      total_page: Math.round(total.count / limit),
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function presentEmployeeById(req, res, next) {
  try {
    let employeeId = parseInt(req.params.employee_id);
    const result = await showEmployeeById(employeeId);

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function saveEmployee(req, res, next) {
  try {
    let { employee_nik, employee_name, employee_contact, employee_address } =
      req.body;

    if (!employee_nik) {
      throw new ErrorMessage("Missing required key: employee_nik", 400);
    }

    if (employee_nik.length > 17) {
      throw new ErrorMessage(
        "Employee nik length cannot exceed 17 characters",
        400
      );
    }

    if (!employee_name) {
      throw new ErrorMessage("Missing required key: employee_name", 400);
    }

    if (!employee_contact) {
      throw new ErrorMessage("Missing required key: employee_contact", 400);
    }

    if (employee_contact.length > 13) {
      throw new ErrorMessage(
        "Employee contact length cannot exceed 13 characters",
        400
      );
    }

    if (!employee_address) {
      throw new ErrorMessage("Missing required key: employee_address", 400);
    }

    employee_nik = employee_nik.trim();
    employee_name = employee_name.trim();
    employee_contact = employee_contact.trim();
    employee_address = employee_address.trim();

    await newEmployee(
      employee_nik,
      employee_name,
      employee_contact,
      employee_address
    );
    return res.status(201).json({
      status: 201,
      message: "Success added employee data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function changeEmployee(req, res, next) {
  try {
    let employeeId = parseInt(req.params.employee_id);
    let update = req.body;
    let fields = [
      "employee_nik",
      "employee_name",
      "employee_contact",
      "employee_address",
    ];
    let invalidField = Object.keys(update).filter((k) => !fields.includes(k));

    if (invalidField.length > 0) {
      throw new ErrorMessage(
        `Missing required key: ${invalidField.join(", ")}`,
        500
      );
    }

    for (let k in update) {
      if (typeof update[k] === "string") {
        update[k] = update[k].trim();
      }

      if (k === "employee_nik" && update[k].length > 17) {
        throw new ErrorMessage(
          "Employee nik length cannot exceed 17 characters",
          400
        );
      }

      if (k === "employee_contact" && update[k].length > 13) {
        throw new ErrorMessage(
          "Employee contact length cannot exceed 13 characters",
          400
        );
      }
    }

    await editEmployee(update, employeeId);
    return res.status(200).json({
      status: 200,
      message: "Success updated employee data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export { presentEmployee, presentEmployeeById, saveEmployee, changeEmployee };
