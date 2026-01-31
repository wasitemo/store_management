import ErrorMessage from "../error/ErrorMessage.js";
import {
  showPaymentMethod,
  showPaymentMethodById,
  showTotalPaymentMethod,
  newPaymentMethod,
  editPaymentMethod,
} from "../service/paymentMethodService.js";

async function presentPaymentMethod(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let offset = (page - 1) * limit;
    let total = await showTotalPaymentMethod();
    const result = await showPaymentMethod(limit, offset);

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

async function presentPaymentMethodById(req, res, next) {
  try {
    let paymentMethodId = parseInt(req.params.payment_method_id);
    const result = await showPaymentMethodById(paymentMethodId);

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function savePaymentMethod(req, res, next) {
  try {
    let paymentMethodName = req.body.payment_method_name;
    if (!paymentMethodName) {
      throw new ErrorMessage(`Missing required key: payment_method_name`);
    }

    paymentMethodName = paymentMethodName.trim();
    await newPaymentMethod(paymentMethodName);
    return res.status(201).json({
      status: 200,
      message: "Success added payment method data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function changePaymentMethod(req, res, next) {
  try {
    let paymentMethodId = parseInt(req.params.payment_method_id);
    let paymentMethodName = req.body.payment_method_name;

    if (!paymentMethodName) {
      throw new ErrorMessage(`Missing required key: payment_method_name`);
    }

    paymentMethodName = paymentMethodName.trim();
    await editPaymentMethod(paymentMethodName, paymentMethodId);
    return res.status(200).json({
      status: 200,
      message: "Success updated payment method data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export {
  presentPaymentMethod,
  presentPaymentMethodById,
  savePaymentMethod,
  changePaymentMethod,
};
