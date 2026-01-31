import ErrorMessage from "../error/ErrorMessage.js";
import {
  getCustomer,
  getCustomerById,
  getTotalCustomer,
  addCustomer,
  updateCustomer,
} from "../model/customerModel.js";

async function showCustomer(limit, offset) {
  const result = await getCustomer(limit, offset);
  if (result.length === 0) {
    throw new ErrorMessage("Customer data not found", 404);
  }

  return result;
}

async function showCustomerById(customerId) {
  const result = await getCustomerById(customerId);
  if (!result) {
    throw new ErrorMessage("Customer data not found", 404);
  }

  return result;
}

async function showTotalCustomer() {
  const result = await getTotalCustomer();
  if (!result) {
    throw new ErrorMessage("Customer data not found", 404);
  }

  return result;
}

async function newCustomer(customerName, customerContact, customerAddress) {
  await addCustomer(customerName, customerContact, customerAddress);
}

async function editCustomer(data, customerId) {
  const existingCustomer = await getCustomerById(customerId);
  if (!existingCustomer) {
    throw new ErrorMessage("Customer data not found", 404);
  }

  const updateData = {
    customer_name: data.customer_name ?? existingCustomer.customer_name,
    customer_contact:
      data.customer_contact ?? existingCustomer.customer_contact,
    customer_address:
      data.customer_address ?? existingCustomer.customer_address,
  };
  await updateCustomer(updateData, customerId);
}

export {
  showCustomer,
  showCustomerById,
  showTotalCustomer,
  newCustomer,
  editCustomer,
};
