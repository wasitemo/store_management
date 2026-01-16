import store from "../config/store.js";

// MAIN QUERY
async function getEmployee() {
  const query = await store.query(`
        SELECT
        employee.employee_id,
        employee_nik,
        employee_name,
        employee_contact,
        employee_address    
        FROM employee
    `);
  const result = query.rows;

  return result;
}

async function getEmployeeById(employeeId) {
  const query = await store.query(
    `
        SELECT
        employee.employee_id,
        employee_nik,
        employee_name,
        employee_contact,
        employee_address
        FROM employee
        WHERE employee_id = $1 
    `,
    [employeeId]
  );
  const result = query.rows[0];

  return result;
}

async function addEmployee(
  employeeNik,
  employeeName,
  employeeAddress,
  employeeContact
) {
  await store.query(
    `
        INSERT INTO employee
        (employee_nik, employee_name, employee_contact, employee_address)
        VALUES
        ($1, $2, $3, $4)   
    `,
    [employeeNik, employeeName, employeeContact, employeeAddress]
  );
}

async function updateEmployee(data, employeeId) {
  const { employee_nik, employee_name, employee_contact, employee_address } =
    data;
  await store.query(
    `
        UPDATE employee
        SET
        employee_nik = $1,
        employee_name = $2,
        employee_contact = $3,
        employee_address = $4
        WHERE employee_id = $5    
    `,
    [
      employee_nik,
      employee_name,
      employee_contact,
      employee_address,
      employeeId,
    ]
  );
}

// UTIL QUERY
async function findEmployeeByNik(employeeNik) {
  const query = await store.query(
    "SELECT employee_nik FROM employee WHERE LOWER(TRIM(employee_nik)) = LOWER(TRIM($1))",
    [employeeNik]
  );
  const result = query.rows[0];

  return result;
}

export {
  getEmployee,
  getEmployeeById,
  findEmployeeByNik,
  addEmployee,
  updateEmployee,
};
