"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../src/lib/api";

const BASE_URL = "http://localhost:3000";

export default function OrderPage() {
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const [orders, setOrders] = useState<any[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    loadOrders();
  }, []);

  const loadOrders = async () => {
    const res = await apiFetch(`${BASE_URL}/customer-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    setOrders(Array.isArray(json.data) ? json.data : []);
  };

  const openDetail = async (orderId: number) => {
    const res = await apiFetch(
      `${BASE_URL}/customer-order-detail/${orderId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const json = await res.json();
    setDetail(json.data);
    setShowDetail(true);
  };

  return (
    <div className="p-container-padding">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Orders</h1>
        <p className="text-text-secondary mt-2">Customer orders list</p>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-hover">
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs uppercase">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase">
                  Payment
                </th>
                <th className="px-6 py-4 text-right text-xs uppercase">
                  Total
                </th>
                <th className="px-6 py-4 text-right text-xs uppercase">
                  Remaining
                </th>
                <th className="px-6 py-4 text-center text-xs uppercase">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border bg-surface">
              {orders.map((o) => (
                <tr key={o.order_id} className="hover:bg-surface-hover">
                  <td className="px-6 py-4 text-sm">{o.order_date}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {o.customer_name}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {o.payment_method_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {o.sub_total}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {o.remaining_payment}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => openDetail(o.order_id)}
                      className="text-primary hover:underline text-sm"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {showDetail && detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl w-full max-w-5xl border border-border shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Order Detail</h2>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>

              {/* HEADER */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <b>Customer:</b> {detail.customer_name}
                </div>
                <div>
                  <b>Employee:</b> {detail.employee_name}
                </div>
                <div>
                  <b>Payment:</b> {detail.payment_method_name}
                </div>
                <div>
                  <b>Order Date:</b> {detail.order_date}
                </div>
              </div>

              {/* ITEMS */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead className="bg-surface-hover">
                      <tr>
                        <th className="px-3 py-2">Product</th>
                        <th className="px-3 py-2">IMEI / SN</th>
                        <th className="px-3 py-2">Barcode</th>
                        <th className="px-3 py-2">Discounts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.stuff_order.map((s: any, i: number) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2">
                            {s.stuff_name} ({s.stuff_variant})
                          </td>
                          <td className="px-3 py-2">
                            {s.imei_1 || s.imei_2 || s.sn || "-"}
                          </td>
                          <td className="px-3 py-2">{s.barcode}</td>
                          <td className="px-3 py-2">
                            {(s.stuff_discounts ?? []).map((d: any) => (
                              <div key={d.discount_id}>
                                {d.discount_name}
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SUMMARY */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <b>Item Discount:</b> {detail.total_item_discount}
                </div>
                <div>
                  <b>Order Discount:</b> {detail.total_order_discount}
                </div>
                <div>
                  <b>Payment:</b> {detail.payment}
                </div>
                <div>
                  <b>Remaining:</b> {detail.remaining_payment}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
