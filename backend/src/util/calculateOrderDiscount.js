import { getDiscountTypeStatusAndValueById } from "../model/discountModel.js";

async function calculateOrderDiscount(discounts, grandTotal) {
  let total = 0;

  for (let d of discounts || []) {
    const result = await getDiscountTypeStatusAndValueById(d.dicount_id);

    if (result?.discount_status) {
      if (result.discount_type === "percentage") {
        total += grandTotal * (result.discount_value / 100);
      } else {
        total += parseFloat(result.discount_value);
      }
    }
  }
  return total;
}

export default calculateOrderDiscount;
