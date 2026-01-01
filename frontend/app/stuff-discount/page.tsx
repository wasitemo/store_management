'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BASE_URL = 'http://localhost:3001';

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
  const [selectedStuff, setSelectedStuff] = useState<number>(0);

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

  useEffect(() => {
    if (!token) router.push('/login');
    else {
      loadData();
      loadStuffList();
    }
  }, []);

  const openAdd = () => {
    setEditing(null);
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

  const openEdit = (stuffId: number, d: Discount) => {
    setSelectedStuff(stuffId);
    setEditing(d);
    setForm({
      discount_name: d.discount_name,
      discount_type: d.discount_type,
      discount_value: String(d.discount_value),
      discount_start: d.started_time,
      discount_end: d.ended_time,
      discount_status: d.discount_status,
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

    let endpoint = `${BASE_URL}/stuff-discount`;

    if (editing) endpoint = `${BASE_URL}/stuff-discount/${editing.discount_id}`;
    body.append('stuff_id', String(selectedStuff));

    await fetch(endpoint, {
      method: editing ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    setShowModal(false);
    loadData();
  };

  return (
    <div className="p-container-padding">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Stuff Discounts</h1>
        <p className="text-text-secondary mt-2">Manage product-specific discount promotions</p>
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

      {data.map((stuff) => (
        <div key={stuff.stuff_id} className="mb-8 bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-surface-hover border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">{stuff.stuff_name}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-hover">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Value</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Period</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {stuff.stuff_discounts.map((d) => (
                  <tr key={d.discount_id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{d.discount_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{d.discount_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{d.discount_value}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{d.started_time} → {d.ended_time}</td>
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
                  {editing ? 'Edit Discount' : 'Add Discount'}
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
                    Product
                  </label>
                  <select
                    value={selectedStuff}
                    onChange={(e) => setSelectedStuff(Number(e.target.value))}
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                  >
                    <option value="">Select Product</option>
                    {stuffList.map((stuff) => (
                      <option key={stuff.stuff_id} value={stuff.stuff_id}>
                        {stuff.stuff_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Discount Name
                  </label>
                  <input
                    placeholder="Enter discount name"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.discount_name}
                    onChange={(e) => setForm({ ...form, discount_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Type
                    </label>
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
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Value
                    </label>
                    <input
                      placeholder="Enter value"
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      value={form.discount_value}
                      onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
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
                      onChange={(e) => setForm({ ...form, discount_start: e.target.value })}
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
                      onChange={(e) => setForm({ ...form, discount_end: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.discount_status}
                    onChange={(e) => setForm({ ...form, discount_status: e.target.checked })}
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
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
