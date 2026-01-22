"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../src/lib/api";

const BASE_URL = "http://localhost:3000";

interface Purchase {
  stuff_purchase_id: number;
  supplier_name: string;
  buy_date: string;
  total_price: string;
}

interface Detail {
  stuff_purchase_id: number;
  supplier_name: string;
  employee_name: string;
  warehouse_name: string;
  stuff_name: string;
  buy_batch: string;
  buy_date: string;
  quantity: number;
  buy_price: string;
  total_price: string;
}

export default function StuffPurchasePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  type SortKey =
    | "stuff_purchase_id"
    | "supplier_name"
    | "buy_date"
    | "total_price";

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });

  const [data, setData] = useState<Purchase[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);

  const [showDetail, setShowDetail] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const [form, setForm] = useState({
    supplier_id: "",
    warehouse_id: "",
    stuff_id: "",
    buy_date: "",
    buy_batch: "",
    quantity: "",
    buy_price: "",
    total_price: "",
  });

  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [meta, setMeta] = useState({
    supplier: [],
    warehouse: [],
    stuff: [],
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // ================= LOAD =================
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [dataRes, metaRes] = await Promise.all([
        apiFetch(`${BASE_URL}/stuff-purchases`),
        apiFetch(`${BASE_URL}/stuff-purchase`),
      ]);
      if (dataRes.status === 401 || metaRes.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }
      const dataJson = await dataRes.json();
      const metaJson = await metaRes.json();
      setData(Array.isArray(dataJson.data) ? dataJson.data : []);
      setMeta(metaJson.data || { supplier: [], warehouse: [], stuff: [] });
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ================= DETAIL =================
  const openDetail = async (id: number) => {
    setError("");
    try {
      const res = await apiFetch(`${BASE_URL}/stuff-purchase-detail/${id}`);
      const json = await res.json();
      setDetail(json.data);
      setShowDetail(true);
    } catch (err) {
      setError("Failed to load detail");
    }
  };

  // ================= MANUAL ADD =================
  const submitForm = async () => {
    setFormError("");
    // Basic validation
    if (!form.supplier_id || !form.warehouse_id || !form.stuff_id || !form.buy_date || !form.quantity || !form.buy_price) {
      setFormError("All fields are required");
      return;
    }

    const body = new URLSearchParams();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));

    const res = await apiFetch(`${BASE_URL}/stuff-purchase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      setFormError("Failed to save purchase");
      return;
    }

    setShowAdd(false);
    loadData();
  };

  // ================= UPLOAD =================
  const submitUpload = async () => {
    if (!file) return alert("Please select a file");

    const formData = new FormData();
    formData.append("file", file);

    const res = await apiFetch(`${BASE_URL}/upload-stuff-purchase`, {
      method: "POST",
      body: formData,
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.message || "Upload failed");
      return;
    }

    alert("Upload success");
    setShowUpload(false);
    setFile(null);
    loadData();
  };

  // ================= SORTING =================
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (typeof aValue === "string" && typeof bValue === "string") {
      const comparison = aValue.localeCompare(bValue);
      return sortConfig.direction === "asc" ? comparison : -comparison;
    } else {
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    }
  });

  // ================= FILTERING =================
  const filteredData = sortedData.filter((purchase) => {
    return (
      purchase.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
      purchase.buy_date.toLowerCase().includes(search.toLowerCase()) ||
      purchase.total_price.toLowerCase().includes(search.toLowerCase())
    );
  });

  // ================= HANDLE SORT =================
  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
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
        <h1 className="text-3xl font-bold text-text-primary">Stuff Purchases</h1>
        <p className="text-text-secondary mt-2">Manage your product purchases</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search purchases..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
            🔍
          </span>
        </div>
        <div className="space-x-3">
          <button
            onClick={() => setShowAdd(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition flex items-center shadow-sm"
          >
            <span className="mr-2">+</span>
            Add Purchase
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-success text-white px-5 py-2.5 rounded-lg hover:bg-emerald-600 transition flex items-center shadow-sm"
          >
            <span className="mr-2">📤</span>
            Upload CSV / Excel
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-hover">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("stuff_purchase_id")}
                >
                  <div className="flex items-center">
                    ID
                    {sortConfig.key === "stuff_purchase_id" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("supplier_name")}
                >
                  <div className="flex items-center">
                    Supplier
                    {sortConfig.key === "supplier_name" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("buy_date")}
                >
                  <div className="flex items-center">
                    Date
                    {sortConfig.key === "buy_date" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("total_price")}
                >
                  <div className="flex items-center">
                    Total
                    {sortConfig.key === "total_price" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {filteredData.map((p) => (
                <tr key={p.stuff_purchase_id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                    {p.stuff_purchase_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {p.supplier_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {p.buy_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {p.total_price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openDetail(p.stuff_purchase_id)}
                      className="text-primary hover:text-primary-dark mr-3 flex items-center"
                    >
                      <span className="mr-1">📋</span> Detail
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-text-secondary">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {showDetail && detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary">Purchase Detail</h2>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                <p><strong>Supplier:</strong> {detail.supplier_name}</p>
                <p><strong>Employee:</strong> {detail.employee_name}</p>
                <p><strong>Warehouse:</strong> {detail.warehouse_name}</p>
                <p><strong>Stuff:</strong> {detail.stuff_name}</p>
                <p><strong>Batch:</strong> {detail.buy_batch}</p>
                <p><strong>Qty:</strong> {detail.quantity}</p>
                <p><strong>Price:</strong> {detail.buy_price}</p>
                <p><strong>Total:</strong> {detail.total_price}</p>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="w-full border border-border py-2 mt-4 rounded-lg hover:bg-surface-hover transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL MODAL */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary">Add Purchase</h2>
                <button
                  onClick={() => setShowAdd(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>
              {formError && (
                <div className="mb-4 bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg">
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">⚠️</span>
                    <span>{formError}</span>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Supplier</label>
                  <select
                    name="supplier_id"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.supplier_id}
                    onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                  >
                    <option value="">Select Supplier</option>
                    {meta.supplier.map((s: any) => (
                      <option key={s.supplier_id} value={s.supplier_id}>
                        {s.supplier_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Warehouse</label>
                  <select
                    name="warehouse_id"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.warehouse_id}
                    onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                  >
                    <option value="">Select Warehouse</option>
                    {meta.warehouse.map((w: any) => (
                      <option key={w.warehouse_id} value={w.warehouse_id}>
                        {w.warehouse_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Stuff</label>
                  <select
                    name="stuff_id"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.stuff_id}
                    onChange={(e) => setForm({ ...form, stuff_id: e.target.value })}
                  >
                    <option value="">Select Stuff</option>
                    {meta.stuff.map((st: any) => (
                      <option key={st.stuff_id} value={st.stuff_id}>
                        {st.stuff_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Buy Date</label>
                  <input
                    name="buy_date"
                    type="date"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.buy_date}
                    onChange={(e) => setForm({ ...form, buy_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Buy Batch</label>
                  <input
                    name="buy_batch"
                    placeholder="Enter batch"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.buy_batch}
                    onChange={(e) => setForm({ ...form, buy_batch: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Quantity</label>
                  <input
                    name="quantity"
                    type="number"
                    placeholder="Enter quantity"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Buy Price</label>
                  <input
                    name="buy_price"
                    type="number"
                    step="0.01"
                    placeholder="Enter price"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.buy_price}
                    onChange={(e) => setForm({ ...form, buy_price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Total Price</label>
                  <input
                    name="total_price"
                    type="number"
                    step="0.01"
                    placeholder="Enter total"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.total_price}
                    onChange={(e) => setForm({ ...form, total_price: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-5 py-2.5 rounded-lg border border-border text-text-primary hover:bg-surface-hover transition"
                >
                  Cancel
                </button>
                <button
                  onClick={submitForm}
                  className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition shadow-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary">Upload Purchase File</h2>
                <button
                  onClick={() => setShowUpload(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button
                  onClick={() => setShowUpload(false)}
                  className="px-5 py-2.5 rounded-lg border border-border text-text-primary hover:bg-surface-hover transition"
                >
                  Cancel
                </button>
                <button
                  onClick={submitUpload}
                  className="bg-success text-white px-5 py-2.5 rounded-lg hover:bg-emerald-600 transition shadow-sm"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
