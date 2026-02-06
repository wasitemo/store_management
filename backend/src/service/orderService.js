import ErrorMessage from "../error/ErrorMessage.js";
import store from "../config/store.js";
import verifyStuff from "../util/verifyStuff.js";
import calculateCuantities from "../util/calculateQuantity.js";
import calculateItemDiscount from "../util/calculateItemDiscount.js";
import calculateOrderDiscount from "../util/calculateOrderDiscount.js";
import { addOrderDiscount } from "../model/discountModel.js";
import { getCustomerIdAndName } from "../model/customerModel.js";
import { getWarehouseName } from "../model/warehouseModel.js";
import { getPaymentMethodIdAndName } from "../model/paymentMethodModel.js";
import { getDiscountIdAndName } from "../model/discountModel.js";
import { updateStatus } from "../model/stuffInformationModel.js";
import { addStock } from "../model/stockModel.js";
import { addOrderDetail } from "../model/orderDetailModel.js";
import { getOrder, getTotalOrder, addOrder } from "../model/orderModel.js";
import {
  getStuffName,
  getStuffStock,
  reduceStock,
} from "../model/stuffModel.js";

async function showOrder(limit, offset) {
  const result = await getOrder(limit, offset);
  if (result.length === 0) {
    throw new ErrorMessage("Order data not found", 404);
  }

  return result;
}

async function showOrderCWPSO() {
  const cResult = await getCustomerIdAndName();
  const wResult = await getWarehouseName();
  const pResult = await getPaymentMethodIdAndName();
  const sResult = await getStuffName();
  const dResult = await getDiscountIdAndName();

  if (cResult.length === 0) {
    throw new ErrorMessage("Customer data not found", 404);
  }

  if (wResult.length === 0) {
    throw new ErrorMessage("Warehouse data not found", 404);
  }

  if (pResult.length === 0) {
    throw new ErrorMessage("Payment method data not found", 404);
  }

  if (sResult.length === 0) {
    throw new ErrorMessage("Stuff data not found", 404);
  }

  if (dResult.length === 0) {
    throw new ErrorMessage("Discount data not found", 404);
  }

  return {
    customer: cResult,
    warehouse: wResult,
    stuff: sResult,
    payment_method: pResult,
    discount: dResult,
  };
}

async function showTotalOrder() {
  const result = await getTotalOrder();
  if (!result) {
    throw new ErrorMessage("Order data not found", 404);
  }

  return result;
}

async function newOrder(
  customerId,
  warehouseId,
  paymentMethodId,
  employeeId,
  orderDate,
  payment,
  items,
  discounts,
) {
  try {
    await store.query("BEGIN");

    let totalItemDiscount = 0;
    let grandTotal = 0;
    let quantities = calculateCuantities(items);

    for (let item of items) {
      let { price, totalDiscount } = await calculateItemDiscount(
        parseInt(item.stuff_id),
      );

      grandTotal += price;
      totalItemDiscount += totalDiscount;
    }

    let orderDiscount = await calculateOrderDiscount(discounts, grandTotal);
    let totalPayment = grandTotal - orderDiscount;
    let remainingPayment = payment - totalPayment;

    const orderId = await addOrder(
      customerId,
      paymentMethodId,
      employeeId,
      orderDate,
      payment,
      totalPayment,
      remainingPayment,
    );

    for (let d of discounts || []) {
      await addOrderDiscount(
        parseInt(orderId.order_id),
        parseInt(d.discount_id),
      );
    }

    for (let item of items) {
      let { stuff_information_id } = await verifyStuff(
        parseInt(item.stuff_id),
        item,
      );
      await addStock(
        warehouseId,
        parseInt(item.stuff_id),
        parseInt(stuff_information_id),
      );
      await addOrderDetail(
        parseInt(item.stuff_id),
        parseInt(orderId.order_id),
        warehouseId,
        item.imei_1,
        item.imei_2,
        item.sn,
        item.barcode,
        totalItemDiscount,
        orderDiscount,
      );
      await updateStatus(parseInt(stuff_information_id));
    }

    for (let q of quantities) {
      let stock = await getStuffStock(parseInt(q.stuff_id));
      if (stock.total_stock < q.quantity) {
        throw new ErrorMessage("Stock insifficient", 409);
      }

      await reduceStock(q.quantity, parseInt(q.stuff_id));
    }

    await store.query("COMMIT");
  } catch (err) {
    await store.query("ROLLBACK");
    console.log(err);
    throw err;
  }
}

export { showOrder, showOrderCWPSO, showTotalOrder, newOrder };
