"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../src/lib/api";

interface Brand {
  stuff_brand_id: number;
  stuff_brand_name: string;
}

export default function StuffBrandPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  type SortKey =
    | "stuff_brand_id"
    | "stuff_brand_name";

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });

  const [data, setData] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    stuff_brand_name: "",
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // ================= LOAD DATA =================
  const loadBrands = async () => {
    try {
      const res = await apiFetch("/stuff-brand");

      if (res.status === 401) {
        // Token refresh handled by apiFetch, but if still 401, redirect
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }

      const json = await res.json();
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  // ================= FORM =================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ stuff_brand_name: "" });
    setShowModal(true);
  };

  const openEdit = async (id: number) => {
    try {
      const res = await apiFetch(`/stuff-brand/${id}`);

      const json = await res.json();

      setEditingId(id);
      setForm({
        stuff_brand_name: json.data.stuff_brand_name,
      });

      setShowModal(true);
    } catch {
      alert("Gagal mengambil data brand");
    }
  };

  const submitForm = async () => {
    try {
      const body = new URLSearchParams();
      body.append("stuff_brand_name", form.stuff_brand_name);

      const endpoint =
        editingId === null
          ? `/stuff-brand`
          : `/stuff-brand/${editingId}`;

      const res = await apiFetch(endpoint, {
        method: editingId === null ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const text = await res.text();
        alert("Server menolak permintaan");
        return;
      }

      setShowModal(false);
      await loadBrands();
    } catch (err) {
      alert("Gagal koneksi ke server");
    }
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
  const filteredData = sortedData.filter((brand) => {
    return (
      brand.stuff_brand_name.toLowerCase().includes(search.toLowerCase())
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
  if (loading)
    return (
      <div className="p-container-padding flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

  if (error)
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

  return (
    <div className="p-container-padding">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Stuff Brands</h1>
        <p className="text-text-secondary mt-2">
          Manage product brand information
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search brands..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
            🔍
          </span>
        </div>
        <button
          onClick={openAdd}
          className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition flex items-center shadow-sm"
        >
          <span className="mr-2">+</span>
          Add Brand
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-hover">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("stuff_brand_id")}
                >
                  <div className="flex items-center">
                    ID
                    {sortConfig.key === "stuff_brand_id" && (
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
                    Brand Name
                    {sortConfig.key === "stuff_brand_name" && (
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
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-surface divide-y divide-border">
              {filteredData.map((b) => (
                <tr
                  key={b.stuff_brand_id}
                  className="hover:bg-surface-hover transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                    {b.stuff_brand_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {b.stuff_brand_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openEdit(b.stuff_brand_id)}
                      className="text-primary hover:text-primary-dark mr-3 flex items-center"
                    >
                      <span className="mr-1">✏️</span> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary">
                  {editingId ? "Edit Brand" : "Add Brand"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Brand Name
                  </label>
                  <input
                    name="stuff_brand_name"
                    placeholder="Enter brand name"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.stuff_brand_name}
                    onChange={handleChange}
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
                  onClick={submitForm}
                  className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition shadow-sm"
                >
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
