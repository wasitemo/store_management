import ErrorMessage from "../error/ErrorMessage.js";
import store from "../config/store.js";
import { getStuffCategoryName } from "../model/stuffCategoryModel.js";
import { getStuffBrandName } from "../model/stuffBrandModel.js";
import { getSupplierName } from "../model/supplierModel.js";
import {
  addStuffHistory,
  updateStuffHistory,
} from "../model/stuffHistoryModel.js";
import {
  getStuff,
  getStuffByStuffId,
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

async function showTotalStuff() {
  const result = await getTotalStuff();
  if (!result) {
    throw new ErrorMessage("Stuff data not found", 404);
  }

  return result;
}

async function newStuff(
  stuffCategoryId,
  stuffBrandId,
  supplierId,
  stuffName,
  stuffCode,
  stuffSku,
  stuffVariant,
  currentSellPrice,
  hasSn,
  employeeId,
) {
  try {
    store.query("BEGIN");

    const stuffData = await addStuff(
      stuffCategoryId,
      stuffBrandId,
      supplierId,
      stuffCode,
      stuffSku,
      stuffName,
      stuffVariant,
      currentSellPrice,
      hasSn,
    );
    await addStuffHistory(stuffData.stuff_id, employeeId, stuffData);

    store.query("COMMIT");
  } catch (err) {
    store.query("ROLLBACK");
    console.log(err);
    throw err;
  }
}

async function editStuff(data, stuffId, employeeId) {
  try {
    store.query("BEGIN");

    const existingData = await getStuffByStuffId(stuffId);
    if (!existingData) {
      throw new ErrorMessage("Stuff data not found", 404);
    }

    let update = {
      stuff_category_id:
        data.stuff_category_id ?? existingData.stuff_category_id,
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

    const stuffData = await updateStuff(update, stuffId);
    await updateStuffHistory(
      stuffData.stuff_id,
      employeeId,
      existingData,
      stuffData,
    );

    store.query("COMMIT");
  } catch (err) {
    store.query("ROLLBACK ");
    console.log(err);
    throw err;
  }
}

export {
  showStuff,
  showStuffById,
  showStuffCBS,
  showTotalStuff,
  newStuff,
  editStuff,
};
