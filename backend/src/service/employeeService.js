import ErrorMessage from "../error/ErrorMessage.js";
import {
  getEmployee,
  getEmployeeById,
  getTotalEmployee,
  findEmployeeByNik,
  addEmployee,
  updateEmployee,
} from "../model/employeeModel.js";

async function showEmployee(limit, offset) {
  const result = await getEmployee(limit, offset);
  if (result.length === 0) {
    throw new ErrorMessage("Employee data not found", 404);
  }

  return result;
}

async function showEmployeeById(employeeId) {
  const result = await getEmployeeById(employeeId);
  if (!result) {
    throw new ErrorMessage("Employee data not found", 404);
  }

  return result;
}

async function showTotalEmployee() {
  const result = await getTotalEmployee();
  if (!result) {
    throw new ErrorMessage("Employee data not found", 404);
  }

  return result;
}

async function newEmployee(
  employeeNik,
  employeeName,
  employeeContact,
  employeeAddress
) {
  const nik = await findEmployeeByNik(employeeNik);
  if (nik) {
    throw new ErrorMessage("Employee NIK has been registered", 500);
  }

  await addEmployee(
    employeeNik,
    employeeName,
    employeeAddress,
    employeeContact
  );
}

async function editEmployee(updateData, employeeId) {
  const existingEmployee = await getEmployeeById(employeeId);
  if (!existingEmployee) {
    throw new ErrorMessage("Employee data not found", 404);
  }

  let data = {
    employee_nik: updateData.employee_nik ?? existingEmployee.employee_nik,
    employee_name: updateData.employee_name ?? existingEmployee.employee_name,
    employee_contact:
      updateData.employee_contact ?? existingEmployee.employee_contact,
    employee_address:
      updateData.employee_address ?? existingEmployee.employee_address,
  };

  await updateEmployee(data, employeeId);
}

export {
  showEmployee,
  showEmployeeById,
  showTotalEmployee,
  newEmployee,
  editEmployee,
};
