import ErrorMessage from "../error/ErrorMessage.js";
import parseCsv from "../util/parseCsv.js";
import parseExcel from "../util/parseExcel.js";
import convertionToNumber from "../util/convertionNumber.js";
import safeUnlink from "../util/safeUnlink.js";
import {
  showStuffPurchase,
  showStuffPurchaseSWS,
  showTotalStuffPuchase,
  newStuffPurchase,
  uploadStuffPurchase,
} from "../service/stuffPurchaseService.js";

async function presentStuffPurchase(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let offset = (page - 1) * limit;
    let total = await showTotalStuffPuchase();
    const result = await showStuffPurchase(limit, offset);

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

async function presentStuffPurchaseSWS(req, res, next) {
  try {
    const result = await showStuffPurchaseSWS();
    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function saveStuffPurchase(req, res, next) {
  try {
    let employeeId = parseInt(req.user.id);
    let {
      supplier_id,
      warehouse_id,
      stuff_id,
      buy_date,
      buy_batch,
      quantity,
      buy_price,
      total_price,
    } = req.body;

    if (!supplier_id) {
      throw new ErrorMessage(`Missing required key: ${supplier_id}`, 400);
    }

    if (!warehouse_id) {
      throw new ErrorMessage(`Missing required key: ${warehouse_id}`, 400);
    }

    if (!stuff_id) {
      throw new ErrorMessage(`Missing required key: ${stuff_id}`, 400);
    }

    if (!buy_date) {
      throw new ErrorMessage(`Missing required key: ${buy_date}`, 400);
    }

    if (!buy_batch) {
      throw new ErrorMessage(`Missing required key: ${buy_batch}`, 400);
    }

    if (!quantity) {
      throw new ErrorMessage(`Missing required key: ${quantity}`, 400);
    }

    if (!buy_price) {
      throw new ErrorMessage(`Missing required key: ${buy_price}`, 400);
    }

    if (!total_price) {
      throw new ErrorMessage(`Missing required key: ${total_price}`, 400);
    }

    supplier_id = parseInt(supplier_id);
    warehouse_id = parseInt(warehouse_id);
    stuff_id = parseInt(stuff_id);
    buy_batch = buy_batch.trim();
    buy_date = buy_date.trim();
    quantity = parseInt(quantity);
    buy_price = convertionToNumber(buy_price);
    total_price = convertionToNumber(total_price);

    await newStuffPurchase(
      supplier_id,
      employeeId,
      warehouse_id,
      stuff_id,
      buy_batch,
      buy_date,
      quantity,
      buy_price,
      total_price,
    );
    return res.status(201).json({
      status: 201,
      message: "Success added stuff purchase data",
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

async function uploadPurchase(req, res, next) {
  const filePath = req.file ? req.file.path : null;
  try {
    let employeeId = parseInt(req.user.id);

    if (!req.file) {
      throw new ErrorMessage("File not found", 404);
    }

    const ext = req.file.originalname.split(".").pop().toLowerCase();
    let rows;

    if (ext === "csv") {
      rows = await parseCsv(filePath);
    } else if (ext === "xlsx" || ext === "xls") {
      rows = await parseExcel(filePath);
    } else {
      throw new ErrorMessage("File format must be csv or xlsx or xls", 400);
    }

    if (!rows || rows.length === 0) {
      throw new ErrorMessage("File cannot be empty", 400);
    }

    await uploadStuffPurchase(rows, employeeId);
    safeUnlink(filePath);
    return res.status(201).json({
      status: 201,
      message: "Success added puchase data",
    });
  } catch (err) {
    safeUnlink(filePath);
    console.log(err);
    next(err);
  }
}

export {
  presentStuffPurchase,
  presentStuffPurchaseSWS,
  saveStuffPurchase,
  uploadPurchase,
};
