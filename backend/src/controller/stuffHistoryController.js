import ErrorMessage from "../error/ErrorMessage.js";
import {
  showStuffHistory,
  showTotalStuffHistory,
} from "../service/stuffHistoryService.js";

async function presentStuffHistory(req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let offset = (page - 1) * limit;
    let total = await showTotalStuffHistory();
    const result = await showStuffHistory(limit, offset);

    return res.status(200).json({
      status: 200,
      page,
      limit,
      total_data: parseInt(total.count),
      total_page: Math.round(page / limit),
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export { presentStuffHistory };
