import ErrorMessage from "../error/ErrorMessage.js";
import convertionToNumber from "../util/convertionNumber.js";
import {
  showOrder,
  showOrderCWPSO,
  showTotalOrder,
  newOrder,
} from "../service/orderService.js";

async function presentOrder(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let offset = (page - 1) * limit;
    let total = await showTotalOrder();
    const result = await showOrder(limit, offset);

    return res.status(200).json({
      status: 200,
      page,
      limit,
      total_data: parseInt(total.count),
      total_page: Math.round(total.count / limit),
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function presentOrderPWSCO(req, res, next) {
  try {
    const result = await showOrderCWPSO();
    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function saveOrder(req, res, next) {
  try {
    let employeeId = parseInt(req.user.id);
    let {
      customer_id,
      warehouse_id,
      payment_method_id,
      order_date,
      payment,
      items,
      discounts,
    } = req.body;

    if (!customer_id) {
      throw new ErrorMessage(`Missing required key: ${customer_id}`);
    }

    if (!warehouse_id) {
      throw new ErrorMessage(`Missing required key: ${warehouse_id}`);
    }

    if (!payment_method_id) {
      throw new ErrorMessage(`Missing required key: ${payment_method_id}`);
    }

    if (!order_date) {
      throw new ErrorMessage(`Missing required key: ${order_date}`);
    }

    if (!payment) {
      throw new ErrorMessage(`Missing required key: ${payment}`);
    }

    customer_id = parseInt(customer_id);
    payment_method_id = parseInt(payment_method_id);
    warehouse_id = parseInt(warehouse_id);
    payment = convertionToNumber(payment);

    await newOrder(
      customer_id,
      warehouse_id,
      payment_method_id,
      employeeId,
      order_date,
      payment,
      items,
      discounts,
    );
    return res.status(201).json({
      status: 201,
      message: "Success added order data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export { presentOrder, presentOrderPWSCO, saveOrder };
