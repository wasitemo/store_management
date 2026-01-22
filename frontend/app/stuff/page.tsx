"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../src/lib/api";

const BASE_URL = "http://localhost:3000";

const EMPTY_FORM = {
  stuff_code: "",
  stuff_name: "",
  stuff_variant: "",
  stuff_sku: "",
  current_sell_price: "",
  has_sn: false,
  barcode: "",
  stuff_category_id: "",
  stuff_brand_id: "",
  supplier_id: "",
};

export default function StuffPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  type SortKey =
    | "stuff_id"
    | "stuff_name"
    | "stuff_category_name"
    | "stuff_brand_name"
    | "supplier_name"
    | "current_sell_price";

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });

  const [stuffs, setStuffs] = useState<any[]>([]);
  const [meta, setMeta] = useState({
    stuff_category: [],
    stuff_brand: [],
    supplier: [],
  });

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState<any>(EMPTY_FORM);

  // ================= SORTING =================
  const sortedStuffs = [...stuffs].sort((a, b) => {
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
  const filteredStuffs = sortedStuffs.filter((s) => {
    return (
      s.stuff_name.toLowerCase().includes(search.toLowerCase()) ||
      s.stuff_category_name.toLowerCase().includes(search.toLowerCase()) ||
      s.stuff_brand_name.toLowerCase().includes(search.toLowerCase()) ||
      s.supplier_name.toLowerCase().includes(search.toLowerCase())
    );
  });

  // ================= HANDLE SORT =================
  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  // ================= LOAD =================
  const loadAll = async () => {
    const [stuffsRes, metaRes] = await Promise.all([
      apiFetch(`${BASE_URL}/stuffs`),
      apiFetch(`${BASE_URL}/stuff`),
    ]);

    if (stuffsRes.status === 401 || metaRes.status === 401) {
      // Token refresh handled by apiFetch, but if still 401, redirect
      localStorage.removeItem("access_token");
      router.push("/login");
      return;
    }

    const stuffsJson = await stuffsRes.json();
    const metaJson = await metaRes.json();

    setStuffs(stuffsJson.data || []);
    setMeta(
      metaJson.data || { stuff_category: [], stuff_brand: [], supplier: [] },
    );
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ================= OPEN FORM =================
  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  };

  const openEditForm = (stuff: any) => {
    setEditId(stuff.stuff_id);
    // Hanya field yang boleh diedit
    setForm({
      current_sell_price: stuff.current_sell_price,
      has_sn: stuff.has_sn,
      stuff_name: stuff.stuff_name,
      stuff_sku: stuff.stuff_sku,
    });
    setShowForm(true);
  };

  // ================= SAVE =================
  const save = async () => {
    // Normalisasi data untuk preview
    const payload: any = { ...form };
    if (payload.has_sn !== undefined)
      payload.has_sn = payload.has_sn ? "true" : "false";
    if (payload.current_sell_price !== undefined)
      payload.current_sell_price = String(payload.current_sell_price);

    const body = new URLSearchParams();
    Object.keys(payload).forEach((k) => body.append(k, payload[k]));

    const url = editId ? `/stuff/${editId}` : `/stuff`;
    const method = editId ? "PATCH" : "POST";

    const res = await apiFetch(url, {
      method,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.message || "Failed");
      return;
    }

    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    loadAll();
  };

  return (
    
    <div className="p-container-padding">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Stuff Management</h1>
        <p className="text-text-secondary mt-2">Manage your product inventory</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
            🔍
          </span>
        </div>
        <button
          onClick={openAddForm}
          className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition flex items-center shadow-sm"
        >
          <span className="mr-2">+</span>
          Add Product
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-hover">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("stuff_id")}
                >
                  <div className="flex items-center">
                    ID
                    {sortConfig.key === "stuff_id" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("stuff_name")}
                >
                  <div className="flex items-center">
                    Name
                    {sortConfig.key === "stuff_name" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("stuff_category_name")}
                >
                  <div className="flex items-center">
                    Category
                    {sortConfig.key === "stuff_category_name" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("stuff_brand_name")}
                >
                  <div className="flex items-center">
                    Brand
                    {sortConfig.key === "stuff_brand_name" && (
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
                  onClick={() => handleSort("current_sell_price")}
                >
                  <div className="flex items-center">
                    Price
                    {sortConfig.key === "current_sell_price" && (
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
                  SN
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
              {filteredStuffs.map((s) => (
                <tr key={s.stuff_id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                    {s.stuff_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {s.stuff_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {s.stuff_category_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {s.stuff_brand_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {s.supplier_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {s.current_sell_price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {String(s.has_sn)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openEditForm(s)}
                      className="text-primary hover:text-primary-dark mr-3 flex items-center"
                    >
                      <span className="mr-1">✏️</span> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStuffs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-text-secondary">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= FORM ================= */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary">
                  {editId ? "Edit Product" : "Add Product"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>

              {/* ================= ADD FORM ================= */}
              {!editId && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Product Code
                    </label>
                    <input
                      placeholder="Enter product code"
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.stuff_code}
                      onChange={(e) =>
                        setForm({ ...form, stuff_code: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Product Name
                    </label>
                    <input
                      placeholder="Enter product name"
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.stuff_name}
                      onChange={(e) =>
                        setForm({ ...form, stuff_name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Variant
                    </label>
                    <input
                      placeholder="Enter variant"
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.stuff_variant}
                      onChange={(e) =>
                        setForm({ ...form, stuff_variant: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      SKU
                    </label>
                    <input
                      placeholder="Enter SKU"
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.stuff_sku}
                      onChange={(e) =>
                        setForm({ ...form, stuff_sku: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Sell Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Enter sell price"
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.current_sell_price}
                      onChange={(e) =>
                        setForm({ ...form, current_sell_price: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Category
                    </label>
                    <select
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.stuff_category_id}
                      onChange={(e) =>
                        setForm({ ...form, stuff_category_id: e.target.value })
                      }
                    >
                      <option value="">Select Category</option>
                      {meta.stuff_category.map((c: any) => (
                        <option
                          key={c.stuff_category_id}
                          value={c.stuff_category_id}
                        >
                          {c.stuff_category_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Brand
                    </label>
                    <select
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.stuff_brand_id}
                      onChange={(e) =>
                        setForm({ ...form, stuff_brand_id: e.target.value })
                      }
                    >
                      <option value="">Select Brand</option>
                      {meta.stuff_brand.map((b: any) => (
                        <option key={b.stuff_brand_id} value={b.stuff_brand_id}>
                          {b.stuff_brand_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Supplier
                    </label>
                    <select
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.supplier_id}
                      onChange={(e) =>
                        setForm({ ...form, supplier_id: e.target.value })
                      }
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
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Barcode
                    </label>
                    <input
                      placeholder="Enter barcode"
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.barcode}
                      onChange={(e) =>
                        setForm({ ...form, barcode: e.target.value })
                      }
                    />
                  </div>

                  <label className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={form.has_sn}
                      onChange={(e) =>
                        setForm({ ...form, has_sn: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm text-text-secondary">Has Serial Number</span>
                  </label>
                </div>
              )}


              {/* ================= EDIT FORM ================= */}
              {editId && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Product Name
                    </label>
                    <input
                      placeholder="Enter product name"
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.stuff_name}
                      onChange={(e) =>
                        setForm({ ...form, stuff_name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      SKU
                    </label>
                    <input
                      placeholder="Enter SKU"
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.stuff_sku}
                      onChange={(e) =>
                        setForm({ ...form, stuff_sku: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Sell Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Enter sell price"
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.current_sell_price}
                      onChange={(e) =>
                        setForm({ ...form, current_sell_price: e.target.value })
                      }
                    />
                  </div>

                  <label className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={form.has_sn}
                      onChange={(e) =>
                        setForm({ ...form, has_sn: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm text-text-secondary">Has Serial Number</span>
                  </label>
                </div>
              )}


              <div className="flex justify-end gap-3 pt-6">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-lg border border-border text-text-primary hover:bg-surface-hover transition"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
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
