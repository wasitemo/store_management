import { showStuffPurchaseDetailById } from "../service/stuffPurchaseDetailService.js";

async function presentStuffPurchaseDetailById(req, res, next) {
  try {
    let purchaseId = parseInt(req.params.stuff_purchase_id);
    const result = await showStuffPurchaseDetailById(purchaseId);

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export { presentStuffPurchaseDetailById };
