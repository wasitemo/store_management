"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../src/lib/api";

const BASE_URL = "http://localhost:3000";

interface Discount {
  discount_id: number;
  discount_name: string;
  discount_type: string;
  discount_value: string;
  started_time: string;
  ended_time: string;
  discount_status: boolean;
  employee_name: string;
}

export default function OrderDiscountPage() {
  const router = useRouter();

  const [data, setData] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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

  // ================= LOAD DATA =================
  const loadData = async () => {
    const res = await apiFetch(`${BASE_URL}/order-discounts`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      localStorage.removeItem("access_token");
      router.push("/login");
      return;
    }

    const json = await res.json();
    setData(json.data);
    setLoading(false);
  };

  useEffect(() => {
    if (!token) router.push("/login");
    else loadData();
  }, []);

  // ================= ADD =================
  const openAdd = () => {
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

  const submitForm = async () => {
    const body = new URLSearchParams();
    body.append("discount_name", form.discount_name);
    body.append("discount_type", form.discount_type);
    body.append("discount_value", form.discount_value);
    body.append("discount_start", form.discount_start);
    body.append("discount_end", form.discount_end);
    body.append("discount_status", String(form.discount_status));

    await apiFetch(`${BASE_URL}/order-discount`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    setShowModal(false);
    loadData();
  };

  // ================= UI =================
  if (loading)
    return (
      <div className="p-container-padding flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

  return (
    <div className="p-container-padding">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">
          Order Discounts
        </h1>
        <p className="text-text-secondary mt-2">
          Manage order-wide discount promotions
        </p>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={openAdd}
          className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition flex items-center shadow-sm"
        >
          <span className="mr-2">+</span>
          Add Discount
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-hover">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase">
                  Value
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase">
                  Period
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase">
                  Employee
                </th>
              </tr>
            </thead>

            <tbody className="bg-surface divide-y divide-border">
              {data.map((d) => (
                <tr key={d.discount_id}>
                  <td className="px-6 py-4 text-sm">{d.discount_name}</td>
                  <td className="px-6 py-4 text-sm">{d.discount_type}</td>
                  <td className="px-6 py-4 text-sm">{d.discount_value}</td>
                  <td className="px-6 py-4 text-sm">
                    {d.started_time} → {d.ended_time}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        d.discount_status
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {d.discount_status ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{d.employee_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL ADD ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Discount</h2>

            <div className="space-y-4">
              <input
                placeholder="Discount Name"
                className="w-full border rounded px-3 py-2"
                value={form.discount_name}
                onChange={(e) =>
                  setForm({ ...form, discount_name: e.target.value })
                }
              />

              <select
                className="w-full border rounded px-3 py-2"
                value={form.discount_type}
                onChange={(e) =>
                  setForm({ ...form, discount_type: e.target.value })
                }
              >
                <option value="fixed">Fixed</option>
                <option value="percentage">Percentage</option>
              </select>

              <input
                placeholder="Value"
                className="w-full border rounded px-3 py-2"
                value={form.discount_value}
                onChange={(e) =>
                  setForm({ ...form, discount_value: e.target.value })
                }
              />

              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={form.discount_start}
                onChange={(e) =>
                  setForm({ ...form, discount_start: e.target.value })
                }
              />

              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={form.discount_end}
                onChange={(e) =>
                  setForm({ ...form, discount_end: e.target.value })
                }
              />

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
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button
                onClick={submitForm}
                className="bg-primary text-white px-4 py-2 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
