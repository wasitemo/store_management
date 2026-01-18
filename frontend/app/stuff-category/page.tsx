"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  stuff_category_id: number;
  stuff_category_name: string;
}

const BASE_URL = "http://localhost:3000";

export default function StuffCategoryPage() {
  const router = useRouter();

  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    stuff_category_name: "",
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // ================= LOAD DATA =================
  const loadCategories = async () => {
    try {
      const res = await fetch(`${BASE_URL}/stuff-category`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
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
    if (!token) router.push("/login");
    else loadCategories();
  }, []);

  // ================= FORM =================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ stuff_category_name: "" });
    setShowModal(true);
  };

  const openEdit = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/stuff-category/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      setEditingId(id);
      setForm({
        stuff_category_name: json.data.stuff_category_name,
      });

      setShowModal(true);
    } catch {
      alert("Gagal mengambil data category");
    }
  };

  const submitForm = async () => {
    try {
      const body = new URLSearchParams();
      body.append("stuff_category_name", form.stuff_category_name);

      const endpoint =
        editingId === null
          ? `${BASE_URL}/stuff-category`
          : `${BASE_URL}/stuff-category/${editingId}`;

      const res = await fetch(endpoint, {
        method: editingId === null ? "POST" : "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(text);
        alert("Server menolak permintaan");
        return;
      }

      setShowModal(false);
      await loadCategories();
    } catch (err) {
      console.error(err);
      alert("Gagal koneksi ke server");
    }
  };

  // ================= UI =================
  if (loading)
    return <p className="p-card-padding text-text-secondary">Loading...</p>;
  if (error) return <p className="p-card-padding text-danger">{error}</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold text-text-primary">
          Stuff Categories
        </h1>
        <button
          onClick={openAdd}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition"
        >
          + Add Category
        </button>
      </div>

      <table className="w-full border border-border rounded text-center">
        <thead className="bg-surface">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Category Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>

        <tbody className="bg-surface divide-y divide-border">
          {data.map((c) => (
            <tr
              key={c.stuff_category_id}
              className="hover:bg-surface-hover transition-colors"
            >
              <td className="px-4 py-3 text-sm text-text-primary">
                {c.stuff_category_id}
              </td>
              <td className="px-4 py-3 text-sm text-text-primary">
                {c.stuff_category_name}
              </td>
              <td className="px-4 py-3 text-sm">
                <button
                  onClick={() => openEdit(c.stuff_category_id)}
                  className="bg-warning text-white px-3 py-1 rounded hover:bg-amber-600 transition"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg shadow-lg w-96 space-y-3 border border-border">
            <h2 className="text-xl font-bold text-text-primary">
              {editingId ? "Edit Category" : "Add Category"}
            </h2>

            <input
              name="stuff_category_name"
              placeholder="Category Name"
              className="w-full border border-border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
              value={form.stuff_category_name}
              onChange={handleChange}
            />

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowModal(false)}
                className="bg-surface text-text-primary px-4 py-2 rounded border border-border hover:bg-surface-hover transition"
              >
                Cancel
              </button>
              <button
                onClick={submitForm}
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
