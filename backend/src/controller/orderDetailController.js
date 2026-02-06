import { showOrderDetail } from "../service/orderDetailService.js";

async function presentOrderDetail(req, res, next) {
  try {
    let orderId = parseInt(req.params.order_id);
    const result = await showOrderDetail(orderId);

    return res.status(200).json({
      status: 200,
      data: result,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export { presentOrderDetail };
