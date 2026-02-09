import ErrorMessage from "../error/ErrorMessage.js";
import {
  getImeiSn,
  getValidImeiSn,
  getTotalImeiSn,
} from "../model/stuffInfoModel.js";

async function showImeiSn(limit, offset) {
  const result = await getImeiSn(limit, offset);
  if (result.length === 0) {
    throw new ErrorMessage("Imei and SN data not found", 404);
  }

  return result;
}

async function showValidImeiSn(warehouseId, identify) {
  const result = await getValidImeiSn(warehouseId, identify);
  if (!result.length) {
    throw new ErrorMessage(
      ` ${identify} not found in warehouse ${warehouseId}`,
      404,
    );
  } else if (result[0].stock_status === "sold") {
    throw new ErrorMessage(`${identify} has been sold`, 409);
  }

  return result;
}

async function showTotalImeiSn() {
  const result = await getTotalImeiSn();
  if (!result) {
    throw new ErrorMessage("Imei or sn data not found", 404);
  }

  return result;
}

export { showImeiSn, showValidImeiSn, showTotalImeiSn };
