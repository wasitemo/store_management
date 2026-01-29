import store from "../config/store.js";

async function getStuffPurchaseDetailById(stuffPurchaseId) {
  const query = await store.query(
    `
        SELECT
        stuff_purchase_detail.stuff_purchase_detail_id,
        warehouse.warehouse_id,
        stuff.stuff_id,
        stuff_purchase.stuff_purchase_id,
        buy_batch,
        quantity,
        buy_price
        INNER JOIN warehouse ON warehouse.warehouse_id = stuff_purchase_detail.warehouse_id    
        INNER JOIN stuff ON stuff.stuff_id = stuff_purchase_detail.stuff_id    
        INNER JOIN stuff_purchase ON stuff_purchase.stuff_purchase_id = stuff_purchase_detail.stuff_purchase_id
        WHERE stuff_purchase_detail.stuff_purchase_id = $1    
    `,
    [stuffPurchaseId],
  );
  const result = query.rows[0];

  return result;
}

async function addStuffPurchaseDetail(
  warehouseId,
  stuffId,
  stuffPurchaseId,
  buyBatch,
  quantity,
  buyPrice,
) {
  await store.query(
    `
        INSERT INTO stuff_purchase_detail
        (warehouse_id, stuff_id, stuff_purchase_id, buy_batch, quantity, buy_price)
        VALUES
        ($1, $2, $3, $4, $5, $6)    
    `,
    [warehouseId, stuffId, stuffPurchaseId, buyBatch, quantity, buyPrice],
  );
}

export { getStuffPurchaseDetailById, addStuffPurchaseDetail };
