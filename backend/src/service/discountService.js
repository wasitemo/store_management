import store from "../config/store.js";
import ErrorMessage from "../error/ErrorMessage.js";
import { getStuffName } from "../model/stuffModel.js";
import {
  getStuffDiscount,
  getStuffDiscountById,
  getOrderDiscount,
  getOrderDiscountById,
  getTotalStuffDiscount,
  getTotalOrderDiscount,
  addStuffDiscount,
  addDiscount,
  updateStuffDiscount,
  updateDiscount,
} from "../model/discountModel.js";

async function showStuffDiscount(limit, offset) {
  const result = await getStuffDiscount(limit, offset);
  if (result.length === 0) {
    throw new ErrorMessage("Stuff discount data not found", 404);
  }

  return result;
}

async function showStuffDiscountById(stuffId) {
  const result = await getStuffDiscountById(stuffId);
  if (!result) {
    throw new ErrorMessage("Stuff discount data not found", 404);
  }

  return result;
}

async function showOrderDiscount(limit, offset) {
  const result = await getOrderDiscount(limit, offset);
  if (result.length === 0) {
    throw new ErrorMessage("Order discount data not found", 404);
  }

  return result;
}

async function showOrderDiscountId(discountId) {
  const result = await getOrderDiscountById(discountId);
  if (!result) {
    throw new ErrorMessage("Order discount data not found", 404);
  }

  return result;
}

async function showTotalStuffDiscount() {
  const result = await getTotalStuffDiscount();
  if (!result) {
    throw new ErrorMessage("Stuff discount data not found", 404);
  }

  return result;
}

async function showTotalOrderDiscount() {
  const result = await getTotalOrderDiscount();
  if (!result) {
    throw new ErrorMessage("Order discount data not found", 404);
  }

  return result;
}

async function showDiscountStf() {
  const result = await getStuffName();
  if (result.length === 0) {
    throw new ErrorMessage("Stuff data not found", 404);
  }

  return result;
}

async function newStuffDiscount(
  stuffId,
  employeeId,
  discountName,
  discountType,
  discountValue,
  discountStart,
  discountEnd,
  discountStatus,
) {
  try {
    await store.query("BEGIN");

    const result = await addDiscount(
      employeeId,
      discountName,
      discountType,
      discountValue,
      discountStart,
      discountEnd,
      discountStatus,
    );
    await addStuffDiscount(stuffId, parseInt(result.discount_id));

    await store.query("COMMIT");
  } catch (err) {
    await store.query("ROLLBACK");
    console.log(err);
    throw err;
  }
}

async function newOrderDiscount(
  employeeId,
  discountName,
  discountType,
  discountValue,
  discountStart,
  discountEnd,
  discountStatus,
) {
  await addDiscount(
    employeeId,
    discountName,
    discountType,
    discountValue,
    discountStart,
    discountEnd,
    discountStatus,
  );
}

async function editStuffDiscount(data, employeeId, discountId) {
  try {
    await store.query("BEGIN");

    const existingDiscount = await getStuffDiscountById(data.stuff_id);
    if (!existingDiscount) {
      throw new ErrorMessage("Discount stuff data not found", 404);
    }

    const update = {
      discount_name:
        data.discount_name ?? existingDiscount.stuff_discounts[0].discount_name,
      discount_type:
        data.discount_type ?? existingDiscount.stuff_discounts[0].discount_type,
      discount_value:
        data.discount_value ??
        existingDiscount.stuff_discounts[0].discount_value,
      discount_start:
        data.discount_start ??
        existingDiscount.stuff_discounts[0].discount_start,
      discount_end:
        data.discount_end ?? existingDiscount.stuff_discounts[0].discount_end,
      discount_status:
        data.discount_status ??
        existingDiscount.stuff_discounts[0].discount_status,
    };

    await updateDiscount(update, employeeId, discountId);
    await updateStuffDiscount(
      data.stuff_id ?? existingDiscount.stuff_id,
      discountId,
    );

    await store.query("COMMIT");
  } catch (err) {
    await store.query("ROLLBACK");
    console.log(err);
    throw err;
  }
}

export {
  showStuffDiscount,
  showOrderDiscountId,
  showOrderDiscount,
  showStuffDiscountById,
  showTotalStuffDiscount,
  showTotalOrderDiscount,
  showDiscountStf,
  newStuffDiscount,
  newOrderDiscount,
  editStuffDiscount,
};
