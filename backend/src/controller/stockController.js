import ErrorMessage from "../error/ErrorMessage.js";
import parseExcel from "../util/parseExcel.js";
import parseCSV from "../util/parseCsv.js";
import safeUnlink from "../util/safeUnlink.js";
import {
  showStock,
  showStockHistory,
  showTotalStock,
  showTotalStockHistory,
  showStockSW,
  newStock,
  uploadStuffStock,
} from "../service/stockService.js";

async function presentStock(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let offset = (page - 1) * limit;
    let total = await showTotalStock();
    const result = await showStock(limit, offset);

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
async function presentStockHistory(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let offset = (page - 1) * limit;
    let total = await showTotalStockHistory();
    const result = await showStockHistory(limit, offset);

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

async function presentStockSW(req, res, next) {
  try {
    const result = await showStockSW();
    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function saveStock(req, res, next) {
  try {
    let { warehouse_id, stuff_id, imei_1, imei_2, sn } = req.body;

    if (!warehouse_id) {
      throw new ErrorMessage(`Missing required key: ${warehouse_id}`, 400);
    }

    if (!stuff_id) {
      throw new ErrorMessage(`Missing required key: ${stuff_id}`, 400);
    }

    if (!imei_1) {
      throw new ErrorMessage(`Missing required key: ${imei_1}`, 400);
    }

    if (!imei_2) {
      throw new ErrorMessage(`Missing required key: ${imei_2}`, 400);
    }

    if (!sn) {
      throw new ErrorMessage(`Missing required key: ${sn}`, 400);
    }

    warehouse_id = parseInt(warehouse_id);
    stuff_id = parseInt(stuff_id);
    imei_1 = imei_1.trim();
    imei_1 = imei_1.trim();
    sn = sn.trim();

    await newStock(warehouse_id, stuff_id, imei_1, imei_2, sn);
    return res.status(201).json({
      status: 201,
      message: "Success added new stock",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function uploadStock(req, res, next) {
  const filePath = req.file ? req.file.path : null;
  try {
    if (!req.file) {
      throw new ErrorMessage("File must be included", 400);
    }

    const ext = req.file.originalname.split(".").pop().toLowerCase();
    let rows;

    if (ext === "csv") {
      rows = await parseCSV(filePath);
    } else if (ext === "xlsx" || ext === "xls") {
      rows = await parseExcel(filePath);
    } else {
      throw new ErrorMessage("File format must be csv or xlsx or xls", 400);
    }

    if (!rows || rows.lengt === 0) {
      throw new ErrorMessage("File cannot be empty", 400);
    }

    await uploadStuffStock(rows);
    safeUnlink(filePath);
    return res.status(201).json({
      status: 201,
      message: "Success added new stock",
    });
  } catch (err) {
    safeUnlink(filePath);
    console.log(err);
    next(err);
  }
}

export {
  presentStock,
  presentStockHistory,
  presentStockSW,
  saveStock,
  uploadStock,
};
