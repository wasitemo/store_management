import ErrorMessage from "../error/ErrorMessage.js";
import {
  getSupplier,
  getSupplierById,
  getTotalSupplier,
  addSupplier,
  updateSupplier,
} from "../model/supplierModel.js";

async function showSupplier(limit, offset) {
  const result = await getSupplier(limit, offset);
  if (result.length === 0) {
    throw new ErrorMessage("Supplier data not found", 404);
  }

  return result;
}

async function showSupplierById(supplierId) {
  const result = await getSupplierById(supplierId);
  if (!result) {
    throw new ErrorMessage("Supplier data not found", 404);
  }

  return result;
}

async function showTotalSupplier() {
  const result = await getTotalSupplier();
  if (!result) {
    throw new ErrorMessage("Supplier data not found", 404);
  }

  return result;
}

async function newSupplier(supplierName, supplierContact, supplierAddress) {
  await addSupplier(supplierName, supplierContact, supplierAddress);
}

async function editSupplier(updateData, supplierId) {
  const existingSupplier = await getSupplierById(supplierId);
  if (!existingSupplier) {
    throw new ErrorMessage("Supplier data not found", 404);
  }

  let data = {
    supplier_name: updateData.supplier_name ?? existingSupplier.supplier_name,
    supplier_contact:
      updateData.supplier_contact ?? existingSupplier.supplier_contact,
    supplier_address:
      updateData.supplier_address ?? existingSupplier.supplier_address,
  };
  await updateSupplier(data, supplierId);
}

export {
  showSupplier,
  showSupplierById,
  showTotalSupplier,
  newSupplier,
  editSupplier,
};
