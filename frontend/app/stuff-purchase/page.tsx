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

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // ================= LOAD =================
  const loadData = async () => {
    const res = await apiFetch(`${BASE_URL}/stuff-purchases`);

    if (res.status === 401) {
      // Token refresh handled by apiFetch, but if still 401, redirect
      localStorage.removeItem("access_token");
      router.push("/login");
      return;
    }

    const json = await res.json();
    setData(json.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ================= DETAIL =================
  const openDetail = async (id: number) => {
    const res = await apiFetch(`${BASE_URL}/stuff-purchase-detail/${id}`);

    const json = await res.json();
    setDetail(json.data);
    setShowDetail(true);
  };

  // ================= MANUAL ADD =================
  const submitForm = async () => {
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
      alert("Failed to save purchase");
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
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
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
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {showDetail && detail && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-96 space-y-2">
            <h2 className="font-bold text-lg">Purchase Detail</h2>
            <p>Supplier: {detail.supplier_name}</p>
            <p>Employee: {detail.employee_name}</p>
            <p>Warehouse: {detail.warehouse_name}</p>
            <p>Stuff: {detail.stuff_name}</p>
            <p>Batch: {detail.buy_batch}</p>
            <p>Qty: {detail.quantity}</p>
            <p>Price: {detail.buy_price}</p>
            <p>Total: {detail.total_price}</p>

            <button
              onClick={() => setShowDetail(false)}
              className="w-full border py-2 mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MANUAL MODAL */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-96 space-y-2">
            <h2 className="font-bold text-lg">Add Purchase</h2>

            {Object.keys(form).map((key) => (
              <input
                key={key}
                placeholder={key}
                className="w-full border p-2"
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            ))}

            <div className="flex gap-2 pt-3">
              <button
                onClick={() => setShowAdd(false)}
                className="border w-1/2 py-2"
              >
                Cancel
              </button>
              <button
                onClick={submitForm}
                className="bg-primary text-white w-1/2 py-2"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-96 space-y-4">
            <h2 className="font-bold text-lg">Upload Purchase File</h2>

            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="w-full border p-2"
              onChange={(e) =>
                setFile(e.target.files ? e.target.files[0] : null)
              }
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowUpload(false)}
                className="border w-1/2 py-2"
              >
                Cancel
              </button>
              <button
                onClick={submitUpload}
                className="bg-success text-white w-1/2 py-2"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
