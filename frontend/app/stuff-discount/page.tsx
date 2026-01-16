"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    const res = await fetch(`${BASE_URL}/stuff-discounts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setData(json.data);
  };

  const loadStuffList = async () => {
    const res = await fetch(`${BASE_URL}/stuff-discount`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setStuffList(json.data.stuff);
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

  const submitForm = async () => {
    const body = new URLSearchParams();

    if (editing) {
      // ===== PATCH (EDIT) =====
      body.append("discount_name", form.discount_name);
      body.append("discount_type", form.discount_type);
      body.append("discount_value", form.discount_value);

      await fetch(`${BASE_URL}/stuff-discount/${editing.discount_id}`, {
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

      await fetch(`${BASE_URL}/stuff-discount`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });
    }

    setShowModal(false);
    loadData();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Stuff Discounts</h1>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add Discount
        </button>
      </div>

      {data.map((stuff) => (
        <div key={stuff.stuff_id} className="mb-6 border rounded">
          <div className="bg-gray-100 px-4 py-2 font-semibold">
            {stuff.stuff_name}
          </div>

          <table className="w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Name</th>
                <th className="p-2">Type</th>
                <th className="p-2">Value</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {stuff.stuff_discounts.map((d) => (
                <tr key={d.discount_id} className="border-b">
                  <td className="p-2">{d.discount_name}</td>
                  <td className="p-2">{d.discount_type}</td>
                  <td className="p-2">{d.discount_value}</td>
                  <td className="p-2">
                    <button
                      onClick={() => openEdit(stuff.stuff_id, d)}
                      className="text-blue-600"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-full max-w-md rounded p-6 space-y-4">
            <h2 className="text-xl font-bold">
              {editing ? "Edit Discount" : "Add Discount"}
            </h2>

            {editing ? (
              <>
                <input
                  placeholder="Discount Name"
                  value={form.discount_name}
                  onChange={(e) =>
                    setForm({ ...form, discount_name: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                />

                <select
                  value={form.discount_type}
                  onChange={(e) =>
                    setForm({ ...form, discount_type: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="fixed">Fixed</option>
                  <option value="percentage">Percentage</option>
                </select>

                <input
                  placeholder="Value"
                  value={form.discount_value}
                  onChange={(e) =>
                    setForm({ ...form, discount_value: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                />
              </>
            ) : (
              <>
                <select
                  value={selectedStuff}
                  onChange={(e) => setSelectedStuff(Number(e.target.value))}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="">Select Product</option>
                  {stuffList.map((s) => (
                    <option key={s.stuff_id} value={s.stuff_id}>
                      {s.stuff_name}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Discount Name"
                  value={form.discount_name}
                  onChange={(e) =>
                    setForm({ ...form, discount_name: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded"
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm({ ...form, discount_type: e.target.value })
                    }
                    className="border px-3 py-2 rounded"
                  >
                    <option value="fixed">Fixed</option>
                    <option value="percentage">Percentage</option>
                  </select>

                  <input
                    placeholder="Value"
                    value={form.discount_value}
                    onChange={(e) =>
                      setForm({ ...form, discount_value: e.target.value })
                    }
                    className="border px-3 py-2 rounded"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={form.discount_start}
                    onChange={(e) =>
                      setForm({ ...form, discount_start: e.target.value })
                    }
                    className="border px-3 py-2 rounded"
                  />
                  <input
                    type="date"
                    value={form.discount_end}
                    onChange={(e) =>
                      setForm({ ...form, discount_end: e.target.value })
                    }
                    className="border px-3 py-2 rounded"
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.discount_status}
                    onChange={(e) =>
                      setForm({ ...form, discount_status: e.target.checked })
                    }
                  />
                  Active
                </label>
              </>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button
                onClick={submitForm}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                {editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
