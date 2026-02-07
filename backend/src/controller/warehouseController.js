import ErrorMessage from "../error/ErrorMessage.js";
import {
  showWarehouse,
  showWarehouseById,
  showtTotalWarehouse,
  newWarehouse,
  editWarehouse,
} from "../service/warehouseService.js";

async function presentWarehouse(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let offset = (page - 1) * limit;
    let total = await showtTotalWarehouse(limit, offset);
    const result = await showWarehouse(limit, offset);
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

async function presentWarehouseById(req, res, next) {
  try {
    let warehouseId = parseInt(req.params.warehouse_id);
    const result = await showWarehouseById(warehouseId);

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function saveWarehouse(req, res, next) {
  try {
    let { warehouse_name, warehouse_address } = req.body;

    if (!warehouse_name) {
      throw new ErrorMessage("Missing required key: warehouse_name", 400);
    }

    if (!warehouse_address) {
      throw new ErrorMessage("Missing required key: warehouse_address", 400);
    }

    warehouse_name = warehouse_name.trim();
    warehouse_address = warehouse_address.trim();

    await newWarehouse(warehouse_name, warehouse_address);
    return res.status(201).json({
      status: 201,
      message: "Success added warehouse data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function changeWarehouse(req, res, next) {
  try {
    let warehouseId = parseInt(req.params.warehouse_id);
    let update = req.body;
    let fields = ["warehouse_name", "warehouse_address"];
    let invalidField = Object.keys(update).filter((k) => !fields.includes(k));

    if (invalidField.length > 0) {
      throw new ErrorMessage(
        `Missing required key: ${invalidField.join(", ")}`,
      );
    }

    for (let k in update) {
      if (typeof update[k] === "string") {
        update[k] = update[k].trim();
      }
    }

    await editWarehouse(update, warehouseId);
    return res.status(200).json({
      status: 200,
      message: "Success updated warehouse data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export {
  presentWarehouse,
  presentWarehouseById,
  saveWarehouse,
  changeWarehouse,
};
