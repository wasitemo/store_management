"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const [stuffs, setStuffs] = useState<any[]>([]);
  const [meta, setMeta] = useState({
    stuff_category: [],
    stuff_brand: [],
    supplier: [],
  });

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [preview, setPreview] = useState<any>(null);

  // ================= LOAD =================
  const loadAll = async () => {
    const headers = { Authorization: `Bearer ${token}` };

    const [stuffsRes, metaRes] = await Promise.all([
      fetch(`${BASE_URL}/stuffs`, { headers }),
      fetch(`${BASE_URL}/stuff`, { headers }),
    ]);

    const stuffsJson = await stuffsRes.json();
    const metaJson = await metaRes.json();

    setStuffs(stuffsJson.data || []);
    setMeta(
      metaJson.data || { stuff_category: [], stuff_brand: [], supplier: [] },
    );
  };

  useEffect(() => {
    if (!token) router.push("/login");
    else loadAll();
  }, []);

  // ================= OPEN FORM =================
  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setPreview(null);
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
    setPreview(null);
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

    setPreview(payload);

    const body = new URLSearchParams();
    Object.keys(payload).forEach((k) => body.append(k, payload[k]));

    const url = editId ? `${BASE_URL}/stuff/${editId}` : `${BASE_URL}/stuff`;
    const method = editId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
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
    <div className="p-10 space-y-8">
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Stuff Management</h1>
        <button
          onClick={openAddForm}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          + Add Product
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">ID</th>
            <th>Name</th>
            <th>Category</th>
            <th>Brand</th>
            <th>Supplier</th>
            <th>Price</th>
            <th>SN</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {stuffs.map((s) => (
            <tr key={s.stuff_id} className="border-t">
              <td className="p-2">{s.stuff_id}</td>
              <td>{s.stuff_name}</td>
              <td>{s.stuff_category_name}</td>
              <td>{s.stuff_brand_name}</td>
              <td>{s.supplier_name}</td>
              <td>{s.current_sell_price}</td>
              <td>{String(s.has_sn)}</td>
              <td>
                <button
                  onClick={() => openEditForm(s)}
                  className="px-2 py-1 bg-yellow-400 rounded text-white"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ================= FORM ================= */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 w-[500px] space-y-4 rounded-xl">
            <h2 className="text-xl font-bold">
              {editId ? "Edit Product" : "Add Product"}
            </h2>

            {/* ================= ADD FORM ================= */}
            {!editId && (
              <>
                <input
                  placeholder="Code"
                  className="input"
                  value={form.stuff_code}
                  onChange={(e) =>
                    setForm({ ...form, stuff_code: e.target.value })
                  }
                />
                <input
                  placeholder="Name"
                  className="input"
                  value={form.stuff_name}
                  onChange={(e) =>
                    setForm({ ...form, stuff_name: e.target.value })
                  }
                />
                <input
                  placeholder="Variant"
                  className="input"
                  value={form.stuff_variant}
                  onChange={(e) =>
                    setForm({ ...form, stuff_variant: e.target.value })
                  }
                />
                <input
                  placeholder="SKU"
                  className="input"
                  value={form.stuff_sku}
                  onChange={(e) =>
                    setForm({ ...form, stuff_sku: e.target.value })
                  }
                />
                <input
                  placeholder="Price"
                  className="input"
                  value={form.current_sell_price}
                  onChange={(e) =>
                    setForm({ ...form, current_sell_price: e.target.value })
                  }
                />

                <select
                  className="input"
                  value={form.stuff_category_id}
                  onChange={(e) =>
                    setForm({ ...form, stuff_category_id: e.target.value })
                  }
                >
                  <option value="">Category</option>
                  {meta.stuff_category.map((c: any) => (
                    <option
                      key={c.stuff_category_id}
                      value={c.stuff_category_id}
                    >
                      {c.stuff_category_name}
                    </option>
                  ))}
                </select>

                <select
                  className="input"
                  value={form.stuff_brand_id}
                  onChange={(e) =>
                    setForm({ ...form, stuff_brand_id: e.target.value })
                  }
                >
                  <option value="">Brand</option>
                  {meta.stuff_brand.map((b: any) => (
                    <option key={b.stuff_brand_id} value={b.stuff_brand_id}>
                      {b.stuff_brand_name}
                    </option>
                  ))}
                </select>

                <select
                  className="input"
                  value={form.supplier_id}
                  onChange={(e) =>
                    setForm({ ...form, supplier_id: e.target.value })
                  }
                >
                  <option value="">Supplier</option>
                  {meta.supplier.map((s: any) => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.supplier_name}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Barcode"
                  className="input"
                  value={form.barcode}
                  onChange={(e) =>
                    setForm({ ...form, barcode: e.target.value })
                  }
                />
                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={form.has_sn}
                    onChange={(e) =>
                      setForm({ ...form, has_sn: e.target.checked })
                    }
                  />
                  Has Serial Number
                </label>
              </>
            )}

            {/* ================= EDIT FORM ================= */}
            {editId && (
              <>
                <input
                  placeholder="Name"
                  className="input"
                  value={form.stuff_name}
                  onChange={(e) =>
                    setForm({ ...form, stuff_name: e.target.value })
                  }
                />
                <input
                  placeholder="SKU"
                  className="input"
                  value={form.stuff_sku}
                  onChange={(e) =>
                    setForm({ ...form, stuff_sku: e.target.value })
                  }
                />
                <input
                  placeholder="Price"
                  className="input"
                  value={form.current_sell_price}
                  onChange={(e) =>
                    setForm({ ...form, current_sell_price: e.target.value })
                  }
                />
                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={form.has_sn}
                    onChange={(e) =>
                      setForm({ ...form, has_sn: e.target.checked })
                    }
                  />
                  Has Serial Number
                </label>
              </>
            )}

            {/* PREVIEW */}
            {preview && (
              <pre className="bg-gray-100 p-3 text-sm overflow-auto rounded">
                {JSON.stringify(preview, null, 2)}
              </pre>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="px-4 py-2 bg-blue-600 text-white rounded"
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
