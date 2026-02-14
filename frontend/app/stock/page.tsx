"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../src/lib/api";

interface StockSummary {
  warehouse_id: number;
  stuff_id: number;
  warehouse_name: string;
  stuff_name: string;
  total_stock: number;
}

interface Stuff {
  stuff_id: number;
  stuff_name: string;
}

interface Warehouse {
  warehouse_id: number;
  warehouse_name: string;
}

export default function StockPage() {
  const router = useRouter();

  const [data, setData] = useState<StockSummary[]>([]);
  const [stuffList, setStuffList] = useState<Stuff[]>([]);
  const [warehouseList, setWarehouseList] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");

  type SortKey = "warehouse_name" | "stuff_name" | "total_stock";

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });

  // ================= LOAD =================
  const loadStocks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/stock");
      if (res.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }
      const json = await res.json();
      setData(json.data || []);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [warehouseRes, stuffRes] = await Promise.all([
        apiFetch("/warehouse"),
        apiFetch("/stuffs"),
      ]);
      const warehouseJson = await warehouseRes.json();
      const stuffJson = await stuffRes.json();
      setStuffList(Array.isArray(stuffJson.data) ? stuffJson.data : []);
      setWarehouseList(Array.isArray(warehouseJson.data) ? warehouseJson.data : []);
    } catch (err) {
      setStuffList([]);
      setWarehouseList([]);
    }
  };

  useEffect(() => {
    loadStocks();
    loadFormData();
  }, []);

  // ================= SUBMIT MANUAL =================
  const submitStock = async () => {
    setFormError("");
    if (!form.warehouse_id || !form.stuff_id || !form.imei_1 || !form.imei_2 || !form.sn) {
      setFormError("All fields are required");
      return;
    }

    const payload = new URLSearchParams();
    payload.append("warehouse_id", form.warehouse_id);
    payload.append("stuff_id", form.stuff_id);
    payload.append("imei_1", form.imei_1.trim());
    payload.append("imei_2", form.imei_2.trim());
    payload.append("sn", form.sn.trim());

    try {
      const res = await apiFetch("/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
      });

      const json = await res.json();

      if (res.ok) {
        alert("Stock added successfully!");
        setShowModal(false);
        setForm({
          warehouse_id: "",
          stuff_id: "",
          imei_1: "",
          imei_2: "",
          sn: "",
        });
        loadStocks();
      } else {
        setFormError(json.message || "Error");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  // ================= UPLOAD CSV / EXCEL =================
  const submitUpload = async () => {
    setFormError("");
    if (!uploadFile) {
      setFormError("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      const res = await apiFetch("/upload-stock", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (res.ok) {
        alert("Upload stock berhasil");
        setShowUpload(false);
        setUploadFile(null);
        loadStocks();
      } else {
        setFormError(json.message || "Upload failed");
      }
    } catch (err) {
      alert("Upload error");
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const [form, setForm] = useState({
    warehouse_id: "",
    stuff_id: "",
    imei_1: "",
    imei_2: "",
    sn: "",
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredAndSortedData = data
    .filter((s) => {
      const keyword = search.toLowerCase();
      return (
        s.warehouse_name.toLowerCase().includes(keyword) ||
        s.stuff_name.toLowerCase().includes(keyword)
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
        <h1 className="text-3xl font-bold text-text-primary">Stock Management</h1>
        <p className="text-text-secondary mt-2">
          Monitor and manage product inventory levels
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search stocks..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
            🔍
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowUpload(true)}
            className="bg-success text-white px-5 py-2.5 rounded-lg hover:bg-emerald-600 transition flex items-center shadow-sm"
          >
            <span className="mr-2">📤</span>
            Upload
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition flex items-center shadow-sm"
          >
            <span className="mr-2">+</span>
            Add Stock
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-hover">
              <tr>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("warehouse_name")}
                >
                  <div className="flex items-center">
                    Warehouse
                    {sortConfig.key === "warehouse_name" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("stuff_name")}
                >
                  <div className="flex items-center">
                    Product
                    {sortConfig.key === "stuff_name" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-center text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("total_stock")}
                >
                  <div className="flex items-center justify-center">
                    Total
                    {sortConfig.key === "total_stock" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {filteredAndSortedData.map((s) => (
                <tr
                  key={`${s.warehouse_id}-${s.stuff_id}`}
                  className="hover:bg-surface-hover transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {s.warehouse_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {s.stuff_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-text-primary">
                    {s.total_stock}
                  </td>
                </tr>
              ))}
              {filteredAndSortedData.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-text-secondary">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* UPLOAD MODAL */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary">Upload Stock</h2>
                <button
                  onClick={() => setShowUpload(false)}
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
                  <label className="block text-sm font-medium text-text-secondary mb-2">Select File</label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                </div>
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

      {/* ADD MANUAL MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary">Add Stock</h2>
                <button
                  onClick={() => setShowModal(false)}
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
                  <label className="block text-sm font-medium text-text-secondary mb-2">Warehouse</label>
                  <select
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.warehouse_id}
                    onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouseList.map((w) => (
                      <option key={w.warehouse_id} value={w.warehouse_id}>
                        {w.warehouse_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Product</label>
                  <select
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.stuff_id}
                    onChange={(e) => setForm({ ...form, stuff_id: e.target.value })}
                  >
                    <option value="">Select Product</option>
                    {stuffList.map((s) => (
                      <option key={s.stuff_id} value={s.stuff_id}>
                        {s.stuff_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">IMEI 1</label>
                  <input
                    placeholder="Enter IMEI 1"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.imei_1}
                    onChange={(e) => setForm({ ...form, imei_1: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">IMEI 2</label>
                  <input
                    placeholder="Enter IMEI 2"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.imei_2}
                    onChange={(e) => setForm({ ...form, imei_2: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Serial Number</label>
                  <input
                    placeholder="Enter Serial Number"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.sn}
                    onChange={(e) => setForm({ ...form, sn: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-lg border border-border text-text-primary hover:bg-surface-hover transition"
                >
                  Cancel
                </button>
                <button
                  onClick={submitStock}
                  className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition shadow-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
