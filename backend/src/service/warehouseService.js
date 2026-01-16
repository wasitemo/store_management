import ErrorMessage from "../error/ErrorMessage.js";
import {
  getWarehouse,
  getWarehouseById,
  addWarehouse,
  updateWarehouse,
} from "../model/warehouseModel.js";

async function showWarehouse() {
  const result = await getWarehouse();
  if (result.length === 0) {
    throw new ErrorMessage("Warehouse data not found", 404);
  }

  return result;
}

async function showWarehouseById(warehouseId) {
  const result = await getWarehouseById(warehouseId);
  if (!result) {
    throw new ErrorMessage("Warehouse data not found", 404);
  }

  return result;
}

async function newWarehouse(warehouseName, warehouseAddress) {
  await addWarehouse(warehouseName, warehouseAddress);
}

async function editWarehouse(updateData, warehouseId) {
  const existingWarehouse = await getWarehouseById(warehouseId);
  if (!existingWarehouse) {
    throw new ErrorMessage("Warehouse data not found", 404);
  }

  let data = {
    warehouse_name:
      updateData.warehouse_name ?? existingWarehouse.warehouse_name,
    warehouse_address:
      updateData.warehouse_address ?? existingWarehouse.warehouse_address,
  };
  await updateWarehouse(data, warehouseId);
}

export { showWarehouse, showWarehouseById, newWarehouse, editWarehouse };
