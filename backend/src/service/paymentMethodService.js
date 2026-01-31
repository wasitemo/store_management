import ErrorMessage from "../error/ErrorMessage.js";
import {
  getPaymentMethod,
  getPaymentMethodById,
  getTotalPaymentMethod,
  addPaymentMethod,
  updatePaymentMethod,
} from "../model/paymentMethodModel.js";

async function showPaymentMethod(limit, offset) {
  const result = await getPaymentMethod(limit, offset);
  if (result.length === 0) {
    throw new ErrorMessage("Payment method data not found", 404);
  }

  return result;
}

async function showPaymentMethodById(paymentMethodId) {
  const result = await getPaymentMethodById(paymentMethodId);
  if (!result) {
    throw new ErrorMessage("Payment method data not fouund", 404);
  }

  return result;
}

async function showTotalPaymentMethod() {
  const result = await getTotalPaymentMethod();
  if (!result) {
    throw new ErrorMessage("Payment method data not fouund", 404);
  }

  return result;
}

async function newPaymentMethod(paymentMethodName) {
  await addPaymentMethod(paymentMethodName);
}

async function editPaymentMethod(paymentMethodName, paymentMethodId) {
  const existingData = await getPaymentMethodById(paymentMethodId);
  if (!existingData) {
    throw new ErrorMessage("Payment method data not found", 404);
  }

  await updatePaymentMethod(paymentMethodName, paymentMethodId);
}

export {
  showPaymentMethod,
  showPaymentMethodById,
  showTotalPaymentMethod,
  newPaymentMethod,
  editPaymentMethod,
};
