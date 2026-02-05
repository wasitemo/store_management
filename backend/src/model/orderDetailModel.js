import store from "../config/store.js";

// MAIN QUERY
async function getOrderDetail(orderId) {
  let query = await store.query(
    `
      SELECT
      customer_order.order_id,
      customer_order.order_date,
      employee.employee_id,
      employee.employee_name,
      customer.customer_id,
      customer.customer_name,
      customer.customer_contact,
      customer.customer_address,
      payment_method.payment_method_name,
      json_agg(
          DISTINCT jsonb_build_object(
              'stuff_id', stuff.stuff_id,
              'stuff_name', stuff.stuff_name,
              'category_name', stuff_category.stuff_category_name,
              'brand_name', stuff_brand.stuff_brand_name,
              'stuff_code', stuff.stuff_code,
              'stuff_sku', stuff.stuff_sku,
              'stuff_variant', stuff.stuff_variant,
              'barcode', stuff.barcode,
              'imei_1', customer_order_detail.imei_1,
              'imei_2', customer_order_detail.imei_2,
              'sn', customer_order_detail.sn,
              'stuff_discounts',
              (
                  SELECT json_agg(
                      jsonb_build_object(
                          'discount_id', discount.discount_id,
                          'discount_name', discount.discount_name,
                          'discount_type', discount.discount_type,
                          'discount_status', discount.discount_status,
                          'discount_value', discount.discount_value
                      )
                  )
                  FROM stuff_discount
                  JOIN discount ON discount.discount_id = stuff_discount.discount_id
                  WHERE stuff_discount.stuff_id = stuff.stuff_id
              )
          )
      ) AS stuff_order,
      (
          SELECT json_agg(
              DISTINCT jsonb_build_object(
          'discount_id', discount.discount_id,
                  'discount_name', discount.discount_name,
                  'discount_type', discount.discount_type,
                  'discount_status', discount.discount_status,
                  'discount_value', discount.discount_value
              )
          )
          FROM order_discount
          JOIN discount ON discount.discount_id = order_discount.discount_id
          WHERE order_discount.order_id = customer_order.order_id
      ) AS order_discounts,
      customer_order_detail.total_item_discount,
      customer_order_detail.total_order_discount,
      customer_order.payment,
      customer_order.sub_total,
      customer_order.remaining_payment
  FROM customer_order
  LEFT JOIN customer ON customer.customer_id = customer_order.customer_id
  LEFT JOIN payment_method ON payment_method.payment_method_id = customer_order.payment_method_id
  LEFT JOIN employee ON employee.employee_id = customer_order.employee_id
  LEFT JOIN customer_order_detail ON customer_order_detail.order_id = customer_order.order_id
  LEFT JOIN stuff ON stuff.stuff_id = customer_order_detail.stuff_id
  LEFT JOIN warehouse ON warehouse.warehouse_id = customer_order_detail.warehouse_id
  LEFT JOIN stuff_category ON stuff.stuff_category_id = stuff_category.stuff_category_id
  LEFT JOIN stuff_brand ON stuff.stuff_brand_id = stuff_brand.stuff_brand_id
  WHERE customer_order.order_id = $1
  GROUP BY
      customer_order.order_id,
      employee.employee_id,
      employee.employee_name,
      customer.customer_id,
      customer.customer_name,
      customer.customer_contact,
      customer.customer_address,
      payment_method.payment_method_name,
      customer_order.order_date,
      customer_order_detail.total_item_discount,
      customer_order_detail.total_order_discount,
      customer_order.payment,
      customer_order.sub_total,
      customer_order.remaining_payment
    `,
    [orderId],
  );
  let result = query.rows[0];

  return result;
}

async function addOrderDetail(
  stuffId,
  orderId,
  warehouseId,
  imei1,
  imei2,
  sn,
  barcode,
  totalItemDiscount,
  totalOrderDiscount,
) {
  await store.query(
    `
        INSERT INTO customer_order_detail
        (stuff_id, order_id, warehouse_id, imei_1, imei_2, sn, barcode, total_item_discount, total_order_discount)
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)    
    `,
    [
      stuffId,
      orderId,
      warehouseId,
      imei1,
      imei2,
      sn,
      barcode,
      totalItemDiscount,
      totalOrderDiscount,
    ],
  );
}

export { getOrderDetail, addOrderDetail };
