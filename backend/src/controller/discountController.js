import ErrorMessage from "../error/ErrorMessage.js";
import convertionToNumber from "../util/convertionNumber.js";
import convertionToDecimal from "../util/convertionToDecimal.js";
import {
  showStuffDiscount,
  showStuffDiscountById,
  showOrderDiscount,
  showOrderDiscountId,
  showTotalStuffDiscount,
  showTotalOrderDiscount,
  showDiscountStf,
  newStuffDiscount,
  newOrderDiscount,
  editStuffDiscount,
} from "../service/discountService.js";

async function presentStuffDiscount(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let offset = (page - 1) * limit;
    let total = await showTotalStuffDiscount();
    const result = await showStuffDiscount(limit, offset);

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

async function presentStuffDiscountById(req, res, next) {
  try {
    let stuffId = parseInt(req.params.stuff_id);
    const result = await showStuffDiscountById(stuffId);

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function presentOrderDiscount(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let offset = (page - 1) * limit;
    let total = await showTotalOrderDiscount();
    const result = await showOrderDiscount(limit, offset);

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

async function presentOrderDiscountById(req, res, next) {
  try {
    let discountId = parseInt(req.params.discount_id);
    const result = await showOrderDiscountId(discountId);

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function presentDiscountStf(req, res, next) {
  try {
    const result = await showDiscountStf();
    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}
async function saveStuffDiscount(req, res, next) {
  try {
    let employeeId = parseInt(req.user.id);
    let {
      stuff_id,
      discount_name,
      discount_type,
      discount_value,
      discount_start,
      discount_end,
      discount_status,
    } = req.body;

    if (!stuff_id) {
      throw new ErrorMessage(`Missing required key: ${stuff_id}`);
    }

    if (!discount_name) {
      throw new ErrorMessage(`Missing required key: ${discount_name}`);
    }

    if (!discount_type) {
      throw new ErrorMessage(`Missing required key: ${discount_type}`);
    }

    if (!discount_value) {
      throw new ErrorMessage(`Missing required key: ${discount_value}`);
    }

    if (!discount_start) {
      throw new ErrorMessage(`Missing required key: ${discount_start}`);
    }

    if (!discount_end) {
      throw new ErrorMessage(`Missing required key: ${discount_end}`);
    }

    if (!discount_status) {
      throw new ErrorMessage(`Missing required key: ${discount_status}`);
    }

    stuff_id = parseInt(stuff_id);
    discount_name = discount_name.trim();
    discount_type = discount_type.toLowerCase().trim();

    if (discount_type === "fixed") {
      discount_value = convertionToNumber(discount_value);
    } else if (discount_type === "percentage") {
      discount_value = convertionToDecimal(discount_value);
    }

    discount_start = discount_start.trim();
    discount_end = discount_end.trim();
    discount_status = discount_status.toLowerCase().trim();

    await newStuffDiscount(
      stuff_id,
      employeeId,
      discount_name,
      discount_type,
      discount_value,
      discount_start,
      discount_end,
      discount_status,
    );
    return res.status(201).json({
      status: 201,
      message: "Success added stuff discount data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function saveOrderDiscount(req, res, next) {
  try {
    let employeeId = parseInt(req.user.id);
    let {
      discount_name,
      discount_type,
      discount_value,
      discount_start,
      discount_end,
      discount_status,
    } = req.body;

    if (!discount_name) {
      throw new ErrorMessage(`Missing required key: ${discount_name}`);
    }

    if (!discount_type) {
      throw new ErrorMessage(`Missing required key: ${discount_type}`);
    }

    if (!discount_value) {
      throw new ErrorMessage(`Missing required key: ${discount_value}`);
    }

    if (!discount_start) {
      throw new ErrorMessage(`Missing required key: ${discount_start}`);
    }

    if (!discount_end) {
      throw new ErrorMessage(`Missing required key: ${discount_end}`);
    }

    if (!discount_status) {
      throw new ErrorMessage(`Missing required key: ${discount_status}`);
    }

    discount_name = discount_name.trim();
    discount_type = discount_type.toLowerCase().trim();

    if (discount_type === "fixed") {
      discount_value = convertionToNumber(discount_value);
    } else if (discount_type === "percentage") {
      discount_value = convertionToDecimal(discount_value);
    }

    discount_start = discount_start.trim();
    discount_end = discount_end.trim();

    await newOrderDiscount(
      employeeId,
      discount_name,
      discount_type,
      discount_value,
      discount_start,
      discount_end,
      discount_status,
    );
    return res.status(201).json({
      status: 201,
      message: "Success added order discount data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function changeStuffDiscount(req, res, next) {
  try {
    let employeeId = parseInt(req.user.id);
    let discountId = parseInt(req.params.discount_id);
    let update = req.body;
    let fields = [
      "stuff_id",
      "discount_name",
      "discount_type",
      "discount_value",
      "discount_start",
      "discount_end",
      "discount_status",
    ];
    let invalidField = Object.keys(update).filter((k) => !fields.includes(k));

    if (invalidField.length > 0) {
      throw new ErrorMessage(
        `Missing required key: ${invalidField.join(", ")}`,
      );
    }

    for (let v in update) {
      if (typeof update[v] === "string") {
        update[v] = update[v].trim();
      }
    }

    update.discount_type = update.discount_type.toLowerCase();
    if (update.discount_type === "fixed") {
      update.discount_value = convertionToNumber(update.discount_value);
    } else if (update.discount_type === "percentage") {
      update.discount_value = convertionToDecimal(update.discount_value);
    }

    await editStuffDiscount(update, employeeId, discountId);
    return res.status(200).json({
      status: 200,
      message: "Success update stuff discount data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export {
  presentStuffDiscount,
  presentStuffDiscountById,
  presentOrderDiscount,
  presentOrderDiscountById,
  presentDiscountStf,
  saveStuffDiscount,
  saveOrderDiscount,
  changeStuffDiscount,
};
