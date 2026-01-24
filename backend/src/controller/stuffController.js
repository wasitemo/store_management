import ErrorMessage from "../error/ErrorMessage.js";
import {
  showStuff,
  showStuffById,
  showImeiSn,
  showValidImeiSn,
  showStuffHistory,
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
      total_page: parseInt(total.count / limit),
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
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function presentImeiSn(req, res, next) {
  try {
    const result = await showImeiSn();
    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function presentValidImeiSn(req, res, status) {
  try {
    let warehouseId = parseInt(req.query.warehouse_id);
    let identify = req.query.identify;

    if (!warehouseId || Number.isNaN(warehouseId)) {
      throw new ErrorMessage("Warehouse id cannot be empty", 400);
    }

    if (!identify) {
      throw new ErrorMessage("Identify cannot be empty", 400);
    }

    identify = identify.trim();

    const result = await showValidImeiSn(warehouseId, identify);
    return res.status(200).json({
      status: 200,
      data: result,
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

async function presentStuffHistory(req, res, next) {
  try {
    const result = await showStuffHistory();
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
    let data = req.body;
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
    let invalidField = Object.keys(body).filter((k) => !fields.includes(k));

    if (invalidField.length > 0) {
      throw new ErrorMessage(
        `Missing required key: ${invalidField.join(", ")}`,
        400,
      );
    }

    for (let k in data) {
      if (k === "stuff_category_id" && typeof data[k] === "string") {
        data[k] = parseInt(data[k]);
      }

      if (k === "stuff_brand_id" && typeof data[k] === "string") {
        data[k] = parseInt(data[k]);
      }

      if (k === "supplier_id" && typeof data[k] === "string") {
        data[k] = parseInt(data[k]);
      }

      if (typeof data[k] === "string") {
        data[k] = data[k].trim();
      }
    }

    await newStuff(data);
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

      if (typeof update[k] === "string") {
        update[k] = update[k].trim();
      }
    }

    await editStuff(update, stuffId);
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
  presentImeiSn,
  presentValidImeiSn,
  presentStuffCBS,
  presentStuffHistory,
  saveStuff,
  changeStuff,
};
