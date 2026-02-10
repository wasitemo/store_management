import ErrorMessage from "../error/ErrorMessage.js";
import {
  getWarehouseName,
  findWarehouseIdByName,
} from "../model/warehouseModel.js";
import {
  getStuffName,
  findStuffIdByName,
  updateTotalStock,
} from "../model/stuffModel.js";
import {
  findImei1,
  findImei2,
  findSn,
  addStuffInformation,
} from "../model/stuffInfoModel.js";
import {
  getStock,
  getStockHistory,
  getTotalStock,
  getTotalStockHistory,
  addStock,
} from "../model/stockModel.js";
import store from "../config/store.js";

async function showStock(limit, offset) {
  const result = await getStock(limit, offset);
  if (result.length === 0) {
    throw new ErrorMessage("Stock data not found", 404);
  }

  return result;
}

async function showStockHistory(limit, offset) {
  const result = await getStockHistory(limit, offset);
  if (result.length === 0) {
    throw new ErrorMessage("Stock history data not found", 404);
  }

  return result;
}

async function showTotalStock() {
  const result = await getTotalStock();
  if (!result) {
    throw new ErrorMessage("Stock data not found", 404);
  }

  return result;
}

async function showTotalStockHistory() {
  const result = await getTotalStockHistory();
  if (!result) {
    throw new ErrorMessage("Stock history data not found", 404);
  }

  return result;
}

async function showStockSW() {
  const stfResult = await getStuffName();
  const wResult = await getWarehouseName();

  if (!stfResult) {
    throw new ErrorMessage("Stuff data not found", 404);
  }

  if (!wResult) {
    throw new ErrorMessage("Warehouse data not found", 404);
  }

  return { stuff: stfResult, warehouse: wResult };
}

async function newStock(warehouseId, stuffId, imei1, imei2, sn, barcode) {
  try {
    await store.query("BEGIN");

    const existingImei1 = await findImei1(imei1);
    const existingImei2 = await findImei2(imei2);
    const existingSn = await findSn(sn);

    if (existingImei1) {
      throw new ErrorMessage("Imei 1 already registered", 409);
    }

    if (existingImei2) {
      throw new ErrorMessage("Imei 2 already registered", 409);
    }

    if (existingSn) {
      throw new ErrorMessage("SN already registered", 409);
    }

    const infoQuery = await addStuffInformation(
      stuffId,
      imei1,
      imei2,
      sn,
      barcode,
    );

    await addStock(
      warehouseId,
      stuffId,
      parseInt(infoQuery.stuff_information_id),
    );
    await updateTotalStock(stuffId, stuffId);

    await store.query("COMMIT");
  } catch (err) {
    await store.query("ROLLBACK");
    console.log(err);
    throw err;
  }
}

async function uploadStuffStock(rows) {
  try {
    await store.query("BEGIN");

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      for (let k in row) {
        if (typeof row[k] === "string") {
          row[k] = row[k].trim();
        }
      }

      let { warehouse_name, stuff_name, imei_1, imei_2, sn, barcode } = row;

      const warehouseId = await findWarehouseIdByName(warehouse_name);
      const stuffId = await findStuffIdByName(stuff_name);

      if (!warehouseId) {
        throw new ErrorMessage(`${warehouse_name} not registered`, 404);
      }

      if (!stuffId) {
        throw new ErrorMessage(`${stuffId} not registered`, 404);
      }

      if (!barcode) {
        throw new ErrorMessage("Barcode cannot be empty", 400);
      }

      const existingImei1 = await findImei1(imei_1);
      const existingImei2 = await findImei2(imei_2);
      const existingSn = await findSn(sn);

      if (existingImei1) {
        throw new ErrorMessage("Imei 1 already registered", 409);
      }

      if (existingImei2) {
        throw new ErrorMessage("Imei 2 already registered", 409);
      }

      if (existingSn) {
        throw new ErrorMessage("SN already registered", 409);
      }

      const infoQuery = await addStuffInformation(
        parseInt(stuffId.stuff_id),
        imei_1,
        imei_2,
        sn,
        barcode,
      );

      await addStock(
        parseInt(warehouseId.warehouse_id),
        parseInt(stuffId.stuff_id),
        parseInt(infoQuery.stuff_information_id),
      );
      await updateTotalStock(
        parseInt(stuffId.stuff_id),
        parseInt(stuffId.stuff_id),
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
  showStock,
  showStockHistory,
  showTotalStock,
  showTotalStockHistory,
  showStockSW,
  newStock,
  uploadStuffStock,
};
