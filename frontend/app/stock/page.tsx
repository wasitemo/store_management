'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface StockSummary {
  warehouse_id: number;
  stuff_id: number;
  warehouse_name: string;
  stuff_name: string;
  total_stock: number;
}

interface Stuff {
  stuff_id: number;
  stuff_name: string;
}

interface Warehouse {
  warehouse_id: number;
  warehouse_name: string;
}

const BASE_URL = 'http://localhost:3001';

export default function StockPage() {
  const router = useRouter();

  const [data, setData] = useState<StockSummary[]>([]);
  const [stuffList, setStuffList] = useState<Stuff[]>([]);
  const [warehouseList, setWarehouseList] = useState<Warehouse[]>([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    warehouse_id: '',
    stuff_id: '',
    imei_1: '',
    imei_2: '',
    sn: '',
  });

  const [file, setFile] = useState<File | null>(null);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;

  // ================= LOAD =================
  const loadStocks = async () => {
    try {
      const res = await fetch(`${BASE_URL}/stocks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      const json = await res.json();
      setData(json.data || []);
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    const res = await fetch(`${BASE_URL}/stock`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();

    setStuffList(json.data.stuff || []);
    setWarehouseList(json.data.warehouse || []);
  };

  useEffect(() => {
    if (!token) router.push('/login');
    else {
      loadStocks();
      loadFormData();
    }
  }, []);

  // ================= FORM =================
  const submitStock = async () => {
    const body = new URLSearchParams(form);

    await fetch(`${BASE_URL}/stock`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    setShowModal(false);
    loadStocks();
  };

  const uploadStock = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    await fetch(`${BASE_URL}/upload-stock`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    setFile(null);
    loadStocks();
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
        <h1 className="text-3xl font-bold text-text-primary">Stock Management</h1>
        <p className="text-text-secondary mt-2">Track and manage inventory across warehouses</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search stock..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">🔍</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition flex items-center shadow-sm"
          >
            <span className="mr-2">+</span>
            Add Stock
          </button>

          <label className="bg-warning text-white px-5 py-2.5 rounded-lg hover:bg-amber-600 transition cursor-pointer flex items-center">
            <span className="mr-2">📤</span>
            Upload
            <input type="file" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
          </label>

          <button
            onClick={uploadStock}
            className="bg-success text-white px-5 py-2.5 rounded-lg hover:bg-success-dark transition flex items-center shadow-sm"
          >
            <span className="mr-2">✅</span>
            Submit Upload
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-hover">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Warehouse</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Product</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">Total Stock</th>
              </tr>
            </thead>

            <tbody className="bg-surface divide-y divide-border">
              {data.map(s => (
                <tr key={`${s.warehouse_id}-${s.stuff_id}`} className="hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{s.warehouse_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{s.stuff_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-text-primary">{s.total_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ADD STOCK */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary">Add Stock</h2>
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
                    Warehouse
                  </label>
                  <select
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    onChange={e => setForm({ ...form, warehouse_id: e.target.value })}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouseList.map(w => (
                      <option key={w.warehouse_id} value={w.warehouse_id}>
                        {w.warehouse_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Product
                  </label>
                  <select
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    onChange={e => setForm({ ...form, stuff_id: e.target.value })}
                  >
                    <option value="">Select Product</option>
                    {stuffList.map(s => (
                      <option key={s.stuff_id} value={s.stuff_id}>
                        {s.stuff_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    IMEI 1
                  </label>
                  <input
                    placeholder="Enter IMEI 1"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    onChange={e => setForm({ ...form, imei_1: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    IMEI 2
                  </label>
                  <input
                    placeholder="Enter IMEI 2"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    onChange={e => setForm({ ...form, imei_2: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Serial Number
                  </label>
                  <input
                    placeholder="Enter Serial Number"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    onChange={e => setForm({ ...form, sn: e.target.value })}
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
                  onClick={submitStock}
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
