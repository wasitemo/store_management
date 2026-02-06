import ErrorMessage from "../error/ErrorMessage.js";
import { getOrderDetail } from "../model/orderDetailModel.js";

async function showOrderDetail(orderId) {
  const result = await getOrderDetail(orderId);
  if (!result) {
    throw new ErrorMessage("Order data not found", 404);
  }

  return result;
}

export { showOrderDetail };
