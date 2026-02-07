import ErrorMessage from "../error/ErrorMessage.js";
import {
  showImeiSn,
  showValidImeiSn,
  showTotalImeiSn,
} from "../service/stuffInfoService.js";

async function presentImeiSn(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let offset = (page - 1) * limit;
    let total = await showTotalImeiSn();
    const result = await showImeiSn(limit, offset);
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

async function presentValidImeiSn(req, res, next) {
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

export { presentImeiSn, presentValidImeiSn };
