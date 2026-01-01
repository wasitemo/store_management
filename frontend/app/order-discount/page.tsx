'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BASE_URL = 'http://localhost:3001';

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
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    discount_name: '',
    discount_type: 'fixed',
    discount_value: '',
    discount_start: '',
    discount_end: '',
    discount_status: true,
  });

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;

  // ================= LOAD DATA =================
  const loadData = async () => {
    const res = await fetch(`${BASE_URL}/order-discounts`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      localStorage.removeItem('access_token');
      router.push('/login');
      return;
    }

    const json = await res.json();
    setData(json.data);
    setLoading(false);
  };

  useEffect(() => {
    if (!token) router.push('/login');
    else loadData();
  }, []);

  // ================= FORM =================
  const openAdd = () => {
    setEditingId(null);
    setForm({
      discount_name: '',
      discount_type: 'fixed',
      discount_value: '',
      discount_start: '',
      discount_end: '',
      discount_status: true,
    });
    setShowModal(true);
  };

  const openEdit = async (id: number) => {
    const res = await fetch(`${BASE_URL}/order-discount/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();

    setEditingId(id);
    setForm({
      discount_name: json.data.discount_name,
      discount_type: json.data.discount_type,
      discount_value: json.data.discount_value,
      discount_start: json.data.started_time,
      discount_end: json.data.ended_time,
      discount_status: json.data.discount_status,
    });

    setShowModal(true);
  };

  const submitForm = async () => {
    const body = new URLSearchParams();
    body.append('discount_name', form.discount_name);
    body.append('discount_type', form.discount_type);
    body.append('discount_value', form.discount_value);
    body.append('discount_start', form.discount_start);
    body.append('discount_end', form.discount_end);
    body.append('discount_status', String(form.discount_status));

    const endpoint =
      editingId === null
        ? `${BASE_URL}/order-discount`
        : `${BASE_URL}/order-discount/${editingId}`;

    await fetch(endpoint, {
      method: editingId === null ? 'POST' : 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    setShowModal(false);
    loadData();
  };

  // ================= UI =================
  if (loading) return (
    <div className="p-container-padding flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="p-container-padding">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Order Discounts</h1>
        <p className="text-text-secondary mt-2">Manage order-wide discount promotions</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search discounts..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">🔍</span>
        </div>
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
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Value</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Period</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Employee</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-surface divide-y divide-border">
              {data.map((d) => (
                <tr key={d.discount_id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{d.discount_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{d.discount_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{d.discount_value}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{d.started_time} → {d.ended_time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      d.discount_status
                        ? 'bg-success/10 text-success'
                        : 'bg-danger/10 text-danger'
                    }`}>
                      {d.discount_status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{d.employee_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openEdit(d.discount_id)}
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

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary">
                  {editingId ? 'Edit Discount' : 'Add Discount'}
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
                    Discount Name
                  </label>
                  <input
                    placeholder="Enter discount name"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.discount_name}
                    onChange={(e) =>
                      setForm({ ...form, discount_name: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Type
                    </label>
                    <select
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.discount_type}
                      onChange={(e) =>
                        setForm({ ...form, discount_type: e.target.value })
                      }
                    >
                      <option value="fixed">Fixed</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Value
                    </label>
                    <input
                      placeholder="Enter value"
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.discount_value}
                      onChange={(e) =>
                        setForm({ ...form, discount_value: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.discount_start}
                      onChange={(e) =>
                        setForm({ ...form, discount_start: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.discount_end}
                      onChange={(e) =>
                        setForm({ ...form, discount_end: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.discount_status}
                    onChange={(e) =>
                      setForm({ ...form, discount_status: e.target.checked })
                    }
                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <label className="ml-2 block text-sm text-text-secondary">
                    Active
                  </label>
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
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
