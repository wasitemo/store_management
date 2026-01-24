import ErrorMessage from "../error/ErrorMessage.js";
import { getStuffCategoryName } from "../model/stuffCategoryModel.js";
import { getStuffBrandName } from "../model/stuffBrandModel.js";
import { getSupplierName } from "../model/supplierModel.js";
import {
  getStuff,
  getStuffByStuffId,
  getImeiSn,
  getValidImeiSn,
  getStuffHistory,
  getTotalStuff,
  addStuff,
  updateStuff,
} from "../model/stuffModel.js";

async function showStuff(limit, offset) {
  const result = await getStuff(limit, offset);
  if (result.length === 0) {
    throw new ErrorMessage("Stuff data not found", 404);
  }

  return result;
}

async function showStuffById(stuffId) {
  const cResult = await getStuffCategoryName();
  const bResult = await getStuffBrandName();
  const sResult = await getSupplierName();
  const stfResult = await getStuffByStuffId(stuffId);

  if (!cResult) {
    throw new ErrorMessage("Stuff category data not found", 404);
  }

  if (!bResult) {
    throw new ErrorMessage("Stuff brand data not found", 404);
  }

  if (!sResult) {
    throw new ErrorMessage("Supplier data not found", 404);
  }

  if (!stfResult) {
    throw new ErrorMessage("Stuff data not found", 404);
  }

  return {
    stuff_category: cResult,
    stuff_brand: bResult,
    supplier: sResult,
    data: stfResult,
  };
}

async function showImeiSn() {
  const result = await getImeiSn();
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
  }

  return result;
}

async function showStuffCBS() {
  const cResult = await getStuffCategoryName();
  const bResult = await getStuffBrandName();
  const sResult = await getSupplierName();

  if (cResult.length === 0) {
    throw new ErrorMessage("Stuff category data not found", 404);
  }

  if (bResult.length === 0) {
    throw new ErrorMessage("Stuff brand data not found", 404);
  }

  if (sResult.length === 0) {
    throw new ErrorMessage("Supplier data not found", 404);
  }

  return {
    stuff_category: cResult,
    stuff_brand: bResult,
    supplier: sResult,
  };
}

async function showStuffHistory() {
  const result = getStuffHistory();
  if (result.length === 0) {
    throw new ErrorMessage("Stuff history data not found", 404);
  }

  return result;
}

async function showTotalStuff() {
  const result = await getTotalStuff();
  if (!result) {
    throw new ErrorMessage("Stuff data not found", 404);
  }

  return result;
}

async function newStuff(data) {
  await addStuff(data);
}

async function editStuff(data, stuffId) {
  const existingData = await getStuffByStuffId(stuffId);
  if (!existingData) {
    throw new ErrorMessage("Stuff data not found", 404);
  }

  let update = {
    stuff_category_id: data.stuff_category_id ?? existingData.stuff_category_id,
    stuff_brand_id: data.stuff_brand_id ?? existingData.stuff_brand_id,
    supplier_id: data.supplier_id ?? existingData.supplier_id,
    stuff_name: data.stuff_name ?? existingData.stuff_name,
    stuff_code: data.stuff_code ?? existingData.stuff_code,
    stuff_sku: data.stuff_sku ?? existingData.stuff_sku,
    stuff_variant: data.stuff_variant ?? existingData.stuff_variant,
    current_sell_price:
      data.current_sell_price ?? existingData.current_sell_price,
    has_sn: data.has_sn ?? existingData.has_sn,
    barcode: data.barcode ?? existingData.barcode,
  };

  await updateStuff(update, stuffId);
}

export {
  showStuff,
  showStuffById,
  showImeiSn,
  showValidImeiSn,
  showStuffHistory,
  showStuffCBS,
  showTotalStuff,
  newStuff,
  editStuff,
};
