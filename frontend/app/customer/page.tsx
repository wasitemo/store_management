"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../src/lib/api";

interface Customer {
  customer_id: number;
  customer_name: string;
  customer_contact: string;
  customer_address: string;
}

export default function CustomerPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  type SortKey =
    | "customer_id"
    | "customer_name"
    | "customer_contact"
    | "customer_address";

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });

  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    customer_name: "",
    customer_contact: "",
    customer_address: "",
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // ================= LOAD DATA =================
  const loadCustomers = async () => {
    try {
      const res = await apiFetch("/customers");

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
    loadCustomers();
  }, []);

  // ================= FORM =================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ customer_name: "", customer_contact: "", customer_address: "" });
    setShowModal(true);
  };

  const openEdit = async (id: number) => {
    try {
      const res = await apiFetch(`/customer/${id}`);

      const json = await res.json();

      setEditingId(id);
      setForm({
        customer_name: json.data.customer_name,
        customer_contact: json.data.customer_contact,
        customer_address: json.data.customer_address,
      });

      setShowModal(true);
    } catch {
      alert("Gagal mengambil data customer");
    }
  };

  const submitForm = async () => {
    try {
      const body = new URLSearchParams();
      body.append("customer_name", form.customer_name);
      body.append("customer_contact", form.customer_contact);
      body.append("customer_address", form.customer_address);

      const endpoint =
        editingId === null
          ? `/customer`
          : `/customer/${editingId}`;

      const res = await apiFetch(endpoint, {
        method: editingId === null ? "POST" : "PATCH",
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
      await loadCustomers();
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
  const filteredData = sortedData.filter((cus) => {
    return (
      cus.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      cus.customer_contact.toLowerCase().includes(search.toLowerCase()) ||
      cus.customer_address.toLowerCase().includes(search.toLowerCase())
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
        <h1 className="text-3xl font-bold text-text-primary">Customers</h1>
        <p className="text-text-secondary mt-2">
          Manage your customer information and details
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search customers..."
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
          Add Customer
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
                  onClick={() => handleSort("customer_id")}
                >
                  <div className="flex items-center">
                    ID
                    {sortConfig.key === "customer_id" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("customer_name")}
                >
                  <div className="flex items-center">
                    Name
                    {sortConfig.key === "customer_name" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("customer_contact")}
                >
                  <div className="flex items-center">
                    Contact
                    {sortConfig.key === "customer_contact" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("customer_address")}
                >
                  <div className="flex items-center">
                    Address
                    {sortConfig.key === "customer_address" && (
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
              {filteredData.map((cus) => (
                <tr
                  key={cus.customer_id}
                  className="hover:bg-surface-hover transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                    {cus.customer_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {cus.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {cus.customer_contact}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary max-w-xs truncate">
                    {cus.customer_address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openEdit(cus.customer_id)}
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
                  {editingId ? "Edit Customer" : "Add Customer"}
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
                    Customer Name
                  </label>
                  <input
                    name="customer_name"
                    placeholder="Enter customer name"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.customer_name}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Contact
                  </label>
                  <input
                    name="customer_contact"
                    placeholder="Enter contact number"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.customer_contact}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Address
                  </label>
                  <input
                    name="customer_address"
                    placeholder="Enter address"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.customer_address}
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
