import ErrorMessage from "../error/ErrorMessage.js";
import { getStuffPurchaseDetailById } from "../model/stuffPurchaseDetailModel.js";

async function showStuffPurchaseDetailById(purchaseId) {
  const result = await getStuffPurchaseDetailById(purchaseId);
  if (!result) {
    throw new ErrorMessage("Stuff purchase detail data not found", 404);
  }

  return result;
}

export { showStuffPurchaseDetailById };
