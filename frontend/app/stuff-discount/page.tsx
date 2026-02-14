"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../src/lib/api";

const BASE_URL = "http://localhost:3000";

interface Stuff {
  stuff_id: number;
  stuff_name: string;
}

interface Discount {
  discount_id: number;
  discount_name: string;
  discount_type: string;
  discount_value: number;
  started_time: string;
  ended_time: string;
  discount_status: boolean;
}

interface StuffDiscount {
  stuff_id: number;
  stuff_name: string;
  stuff_discounts: Discount[];
}

export default function StuffDiscountPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  type SortKey =
    | "stuff_id"
    | "stuff_name";

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });

  const [data, setData] = useState<StuffDiscount[]>([]);
  const [stuffList, setStuffList] = useState<Stuff[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [selectedStuff, setSelectedStuff] = useState<number | "">("");

  const [form, setForm] = useState({
    discount_name: "",
    discount_type: "fixed",
    discount_value: "",
    discount_start: "",
    discount_end: "",
    discount_status: true,
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!token) router.push("/login");
    else {
      loadData();
      loadStuffList();
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`${BASE_URL}/stuff-discount`);
      if (res.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }
      const json = await res.json();
      setData(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadStuffList = async () => {
    try {
      const res = await apiFetch(`${BASE_URL}/stuff-discount`);
      if (res.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }
      if (res.status === 404) {
        setStuffList([]);
        return;
      }
      const json = await res.json();
      setStuffList(json.data.stuff);
    } catch (err) {
      setError("Failed to load stuff list");
    }
  };

  const openAdd = () => {
    setEditing(null);
    setSelectedStuff("");
    setForm({
      discount_name: "",
      discount_type: "fixed",
      discount_value: "",
      discount_start: "",
      discount_end: "",
      discount_status: true,
    });
    setShowModal(true);
  };

  const openEdit = (stuffId: number, d: Discount) => {
    setEditing(d);
    setSelectedStuff(stuffId);
    setForm({
      discount_name: d.discount_name,
      discount_type: d.discount_type,
      discount_value: String(d.discount_value),
      discount_start: "",
      discount_end: "",
      discount_status: true,
    });
    setShowModal(true);
  };

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredAndSortedData = data
    .filter((stuff) => stuff.stuff_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  const submitForm = async () => {
    setFormError("");
    // Basic validation
    if (!editing && !selectedStuff) {
      setFormError("Please select a stuff");
      return;
    }
    if (!form.discount_name || !form.discount_value) {
      setFormError("Discount name and value are required");
      return;
    }

    const body = new URLSearchParams();

    if (editing) {
      // ===== PATCH (EDIT) =====
      body.append("discount_name", form.discount_name);
      body.append("discount_type", form.discount_type);
      body.append("discount_value", form.discount_value);

      await apiFetch(`${BASE_URL}/stuff-discount/${editing.discount_id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });
    } else {
      // ===== POST (ADD) =====
      body.append("stuff_id", String(selectedStuff));
      body.append("discount_name", form.discount_name);
      body.append("discount_type", form.discount_type);
      body.append("discount_value", form.discount_value);
      body.append("discount_start", form.discount_start);
      body.append("discount_end", form.discount_end);
      body.append("discount_status", String(form.discount_status));

      const res = await apiFetch(`${BASE_URL}/stuff-discount`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!res.ok) {
        setFormError("Failed to save discount");
        return;
      }
    }

    setShowModal(false);
    loadData();
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
        <h1 className="text-3xl font-bold text-text-primary">Stuff Discounts</h1>
        <p className="text-text-secondary mt-2">Manage discounts for products</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search stuff..."
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
          Add Discount
        </button>
      </div>

      {filteredAndSortedData.length === 0 && (
        <div className="text-center text-text-secondary py-8">
          Tidak ada data
        </div>
      )}
      {filteredAndSortedData.map((stuff) => (
        <div key={stuff.stuff_id} className="mb-6 bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="bg-surface-hover px-6 py-4 font-semibold text-text-primary">
            <div className="flex items-center">
              <span>{stuff.stuff_name}</span>
              {sortConfig.key === "stuff_name" && (
                <span className="ml-2">
                  {sortConfig.direction === "asc" ? "▲" : "▼"}
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-hover">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {stuff.stuff_discounts.map((d) => (
                  <tr key={d.discount_id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {d.discount_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {d.discount_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {d.discount_value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => openEdit(stuff.stuff_id, d)}
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
      ))}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary">
                  {editing ? "Edit Discount" : "Add Discount"}
                </h2>
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
                {!editing && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Stuff</label>
                    <select
                      value={selectedStuff}
                      onChange={(e) => setSelectedStuff(Number(e.target.value))}
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    >
                      <option value="">Select Stuff</option>
                      {stuffList.map((s) => (
                        <option key={s.stuff_id} value={s.stuff_id}>
                          {s.stuff_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Discount Name</label>
                  <input
                    placeholder="Enter discount name"
                    value={form.discount_name}
                    onChange={(e) => setForm({ ...form, discount_name: e.target.value })}
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Type</label>
                    <select
                      value={form.discount_type}
                      onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Value</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Enter value"
                      value={form.discount_value}
                      onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    />
                  </div>
                </div>
                {!editing && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Start Date</label>
                        <input
                          type="date"
                          value={form.discount_start}
                          onChange={(e) => setForm({ ...form, discount_start: e.target.value })}
                          className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">End Date</label>
                        <input
                          type="date"
                          value={form.discount_end}
                          onChange={(e) => setForm({ ...form, discount_end: e.target.value })}
                          className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.discount_status}
                        onChange={(e) => setForm({ ...form, discount_status: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-text-secondary">Active</span>
                    </label>
                  </>
                )}
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
                  {editing ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
