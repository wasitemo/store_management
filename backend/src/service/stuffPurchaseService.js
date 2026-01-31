import ErrorMessage from "../error/ErrorMessage.js";
import store from "../config/store.js";
import { addStuffPurchaseDetail } from "../model/stuffPurchaseDetailModel.js";
import { getStuffName, findStuffIdByName } from "../model/stuffModel.js";
import {
  getSupplierName,
  findSupplierIdByName,
} from "../model/supplierModel.js";
import {
  getWarehouseName,
  findWarehouseIdByName,
} from "../model/warehouseModel.js";
import {
  getStuffPurchase,
  addStuffPurchase,
  getTotalStuffPurchase,
} from "../model/stuffPurchaseModel.js";

async function showStuffPurchase(limit, offset) {
  const result = await getStuffPurchase(limit, offset);
  if (result.length === 0) {
    throw new ErrorMessage("Stuff purchase data not found", 404);
  }

  return result;
}

async function showStuffPurchaseSWS() {
  const sResult = await getSupplierName();
  const wResult = await getWarehouseName();
  const stfResult = await getStuffName();

  if (sResult.length === 0) {
    throw new ErrorMessage("Supplier data not found", 404);
  }

  if (wResult.length === 0) {
    throw new ErrorMessage("Warehouse data not found", 404);
  }

  if (stfResult.length === 0) {
    throw new ErrorMessage("Stuff data not found", 404);
  }

  return {
    supplier: sResult,
    warehouse: wResult,
    stuff: stfResult,
  };
}

async function showTotalStuffPuchase() {
  const result = await getTotalStuffPurchase();
  if (!result) {
    throw new ErrorMessage("Stuff purchase data not found", 404);
  }

  return result;
}

async function newStuffPurchase(
  supplierId,
  employeeId,
  warehouseId,
  stuffId,
  buyBatch,
  buyDate,
  quantity,
  buyPrice,
  totalPrice,
) {
  try {
    await store.query("BEGIN");

    const stfQuery = await addStuffPurchase(
      supplierId,
      employeeId,
      buyDate,
      totalPrice,
    );
    await addStuffPurchaseDetail(
      warehouseId,
      stuffId,
      stfQuery.stuff_purchase_id,
      buyBatch,
      quantity,
      buyPrice,
    );

    await store.query("COMMIT");
  } catch (err) {
    await store.query("ROLLBACK");
    console.log(err);
    throw err;
  }
}

async function uploadStuffPurchase(rows, employeeId) {
  try {
    await store.query("BEGIN");

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      for (let k in row) {
        if (typeof row[k] === "string") {
          row[k] = row[k].toLowerCase().trim();
        }
      }

      let {
        supplier_name,
        warehouse_name,
        stuff_name,
        buy_date,
        buy_batch,
        quantity,
        buy_price,
        total_price,
      } = row;

      quantity = parseInt(quantity);
      buy_price = parseInt(buy_price);
      total_price = parseInt(total_price);

      const supplierId = await findSupplierIdByName(supplier_name);
      const warehousesId = await findWarehouseIdByName(warehouse_name);
      const stuffId = await findStuffIdByName(stuff_name);

      if (!supplierId) {
        throw new ErrorMessage(`${supplier_name} not registered`, 404);
      }

      if (!warehousesId) {
        throw new ErrorMessage(`${warehouse_name} not registered`, 404);
      }

      if (!stuffId) {
        throw new ErrorMessage(`${stuff_name} not registered`, 404);
      }

      const stuffPurchaseId = await addStuffPurchase(
        parseInt(supplierId.supplier_id),
        employeeId,
        buy_date,
        total_price,
      );
      await addStuffPurchaseDetail(
        parseInt(warehousesId.warehouse_id),
        parseInt(stuffId.stuff_id),
        parseInt(stuffPurchaseId.stuff_purchase_id),
        buy_batch,
        quantity,
        buy_price,
      );
    }

    await store.query("COMMIT");
  } catch (err) {
    await store.query("ROLLBACK");
    console.log(err);
    throw err;
  }
}

export {
  showStuffPurchase,
  showStuffPurchaseSWS,
  showTotalStuffPuchase,
  newStuffPurchase,
  uploadStuffPurchase,
};
