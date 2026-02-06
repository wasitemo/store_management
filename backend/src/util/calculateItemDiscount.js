import { getStuffPriceAndDiscount } from "../model/discountModel.js";

async function calculateItemDiscount(stuffId) {
  const result = await getStuffPriceAndDiscount(stuffId);
  if (!result) {
    return { price: 0, totalDiscount: 0 };
  }

  let totalDiscount = 0;

  for (let d of result.discounts || []) {
    if (d.discount_status === true) {
      if (d.discount_type === "percentage") {
        totalDiscount += result.current_sell_price * (d.discount_value / 100);
      } else if (d.discount_type === "fixed") {
        totalDiscount += d.discount_value;
      }
    }
  }

  return {
    price: parseFloat(result.current_sell_price) - totalDiscount,
    totalDiscount,
  };
}

export default calculateItemDiscount;
