"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../src/lib/api";

export default function OrderPage() {
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);

  type SortKey =
    | "order_date"
    | "customer_name"
    | "payment_method_name"
    | "sub_total"
    | "remaining_payment";

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });

  useEffect(() => {
    loadOrders();
  }, [page, limit]);

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        page: String(page),
      });
      const res = await apiFetch(`/customer-order?${params.toString()}`);
      if (res.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }
      const json = await res.json();
      setOrders(Array.isArray(json.data) ? json.data : []);
      setTotalPages(json.total_page || 1);
      setTotalData(json.total_data || 0);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const filteredAndSortedOrders = orders
    .filter((o) => {
      const keyword = search.toLowerCase();
      return (
        o.customer_name.toLowerCase().includes(keyword) ||
        o.payment_method_name.toLowerCase().includes(keyword) ||
        o.sub_total.toString().includes(keyword) ||
        o.remaining_payment.toString().includes(keyword)
      );
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const openDetail = async (orderId: number) => {
    setError("");
    try {
      const res = await apiFetch(`/customer-order-detail/${orderId}`);
      if (res.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }
      const json = await res.json();
      setDetail(json.data);
      setShowDetail(true);
    } catch (err) {
      setError("Failed to load detail");
    }
  };

  // ================= UI =================
  if (loading) {
    return (
      <div className="p-container-padding flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-container-padding">
        <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <span className="mr-2 text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-container-padding">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Orders</h1>
        <p className="text-text-secondary mt-2">Customer orders list</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
            🔍
          </span>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-hover">
              <tr>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("order_date")}
                >
                  <div className="flex items-center">
                    Date
                    {sortConfig.key === "order_date" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("customer_name")}
                >
                  <div className="flex items-center">
                    Customer
                    {sortConfig.key === "customer_name" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("payment_method_name")}
                >
                  <div className="flex items-center">
                    Payment
                    {sortConfig.key === "payment_method_name" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-right text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("sub_total")}
                >
                  <div className="flex items-center justify-end">
                    Total
                    {sortConfig.key === "sub_total" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-right text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("remaining_payment")}
                >
                  <div className="flex items-center justify-end">
                    Remaining
                    {sortConfig.key === "remaining_payment" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {filteredAndSortedOrders.map((o) => (
                <tr
                  key={o.order_id}
                  className="hover:bg-surface-hover transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {o.order_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                    {o.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {o.payment_method_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">
                    {o.sub_total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">
                    {o.remaining_payment}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <button
                      onClick={() => openDetail(o.order_id)}
                      className="text-primary hover:text-primary-dark mr-3 flex items-center"
                    >
                      <span className="mr-1">📋</span> Detail
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAndSortedOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-text-secondary">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* pagination controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-text-secondary">
          Page {page} of {totalPages} ({totalData} items)
        </div>
        <div className="space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 rounded-lg border border-border bg-surface hover:bg-surface-hover disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded-lg border border-border bg-surface hover:bg-surface-hover disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {showDetail && detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-5xl border border-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text-primary">Order Detail</h2>
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
                <h3 className="font-semibold mb-3 text-text-primary">Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border border-border rounded-lg">
                    <thead className="bg-surface-hover">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          IMEI / SN
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Barcode
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                          Discounts
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-surface">
                      {detail.stuff_order.map((s: any, i: number) => (
                        <tr
                          key={i}
                          className="border-t border-border hover:bg-surface-hover transition-colors"
                        >
                          <td className="px-3 py-2 text-text-primary">
                            {s.stuff_name} ({s.stuff_variant})
                          </td>
                          <td className="px-3 py-2 text-text-primary font-mono">
                            {s.imei_1 || s.imei_2 || s.sn || "-"}
                          </td>
                          <td className="px-3 py-2 text-text-primary">
                            {s.barcode}
                          </td>
                          <td className="px-3 py-2 text-text-primary">
                            {(s.stuff_discounts ?? []).map((d: any) => (
                              <div key={d.discount_id}>{d.discount_name}</div>
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

              <div className="flex justify-end pt-6">
                <button
                  onClick={() => setShowDetail(false)}
                  className="px-5 py-2.5 rounded-lg border border-border text-text-primary hover:bg-surface-hover transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
