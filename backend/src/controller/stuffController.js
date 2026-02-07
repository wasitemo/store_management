import ErrorMessage from "../error/ErrorMessage.js";
import convertionToNumber from "../util/convertionNumber.js";
import {
  showStuff,
  showStuffById,
  showStuffCBS,
  showTotalStuff,
  newStuff,
  editStuff,
} from "../service/stuffService.js";

async function presentStuff(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let offset = (page - 1) * limit;
    let total = await showTotalStuff();
    const result = await showStuff(limit, offset);

    return res.status(200).json({
      status: 200,
      page,
      limit,
      total_data: parseInt(total.count),
      total_page: Math.ceil(total.count / limit),
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function presentStuffById(req, res, next) {
  try {
    let stuffId = parseInt(req.params.stuff_id);
    const result = await showStuffById(stuffId);

    return res.status(200).json({
      status: 200,
      stuff_category: result.stuff_category,
      stuff_brand: result.stuff_brand,
      supplier: result.supplier,
      data: result.data,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function presentStuffCBS(req, res, next) {
  try {
    const result = await showStuffCBS();
    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function saveStuff(req, res, next) {
  try {
    let {
      stuff_category_id,
      stuff_brand_id,
      supplier_id,
      stuff_code,
      stuff_sku,
      stuff_name,
      stuff_variant,
      current_sell_price,
      has_sn,
      barcode,
    } = req.body;
    let employeeId = parseInt(req.user.id);

    if (!stuff_category_id) {
      throw new ErrorMessage(`Missing required key ${stuff_category_id}`);
    }

    if (!stuff_brand_id) {
      throw new ErrorMessage(`Missing required key ${stuff_brand_id}`);
    }

    if (!supplier_id) {
      throw new ErrorMessage(`Missing required key ${supplier_id}`);
    }

    if (!stuff_code) {
      throw new ErrorMessage(`Missing required key ${stuff_code}`);
    }

    if (!stuff_sku) {
      throw new ErrorMessage(`Missing required key ${stuff_sku}`);
    }

    if (!stuff_name) {
      throw new ErrorMessage(`Missing required key ${stuff_name}`);
    }

    if (!stuff_variant) {
      throw new ErrorMessage(`Missing required key ${stuff_variant}`);
    }

    if (!current_sell_price) {
      throw new ErrorMessage(`Missing required key ${current_sell_price}`);
    }

    if (!has_sn) {
      throw new ErrorMessage(`Missing required key ${has_sn}`);
    }

    if (!barcode) {
      throw new ErrorMessage(`Missing required key ${barcode}`);
    }

    stuff_category_id = parseInt(stuff_category_id);
    stuff_brand_id = parseInt(stuff_brand_id);
    supplier_id = parseInt(supplier_id);
    stuff_name = stuff_name.trim();
    stuff_code = stuff_code.trim();
    stuff_sku = stuff_sku.trim();
    stuff_variant = stuff_variant.trim();
    current_sell_price = convertionToNumber(current_sell_price);
    barcode = barcode.trim();

    await newStuff(
      stuff_category_id,
      stuff_brand_id,
      supplier_id,
      stuff_name,
      stuff_code,
      stuff_sku,
      stuff_variant,
      current_sell_price,
      has_sn,
      barcode,
      employeeId,
    );
    return res.status(201).json({
      status: 201,
      message: "Success added data stuff",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function changeStuff(req, res, next) {
  try {
    let stuffId = parseInt(req.params.stuff_id);
    let employeeId = parseInt(req.user.id);
    let update = req.body;
    let fields = [
      "stuff_category_id",
      "stuff_brand_id",
      "supplier_id",
      "stuff_code",
      "stuff_sku",
      "stuff_name",
      "stuff_variant",
      "current_sell_price",
      "has_sn",
      "barcode",
    ];
    const invalidField = Object.keys(update).filter((k) => !fields.includes(k));

    if (invalidField.length > 0) {
      throw new ErrorMessage(
        `Missing required key: ${invalidField.join(", ")}`,
      );
    }

    for (let k in update) {
      if (k === "stuff_category_id" && typeof update[k] === "string") {
        update[k] = parseInt(update[k]);
      }

      if (k === "stuff_brand_id" && typeof update[k] === "string") {
        update[k] = parseInt(update[k]);
      }

      if (k === "supplier_id" && typeof update[k] === "string") {
        update[k] = parseInt(update[k]);
      }

      if (k === "current_sell_price" && typeof update[k] === "string") {
        update[k] = convertionToNumber(update[k]);
      }

      if (typeof update[k] === "string") {
        update[k] = update[k].trim();
      }
    }

    await editStuff(update, stuffId, employeeId);
    return res.status(200).json({
      status: 200,
      message: "Success updated stuff data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export {
  presentStuff,
  presentStuffById,
  presentStuffCBS,
  saveStuff,
  changeStuff,
};
