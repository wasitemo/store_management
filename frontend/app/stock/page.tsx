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
  const [showUpload, setShowUpload] = useState(false);

  const [form, setForm] = useState({
    warehouse_id: '',
    stuff_id: '',
    imei_1: '',
    imei_2: '',
    sn: '',
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [debugPayload, setDebugPayload] = useState<any>(null);

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

  // ================= SUBMIT MANUAL =================
  const submitStock = async () => {
    if (
      !form.warehouse_id ||
      !form.stuff_id ||
      !form.imei_1 ||
      !form.imei_2 ||
      !form.sn
    ) {
      alert('Semua field wajib diisi');
      return;
    }

    const payload = new URLSearchParams();
    payload.append('warehouse_id', form.warehouse_id);
    payload.append('stuff_id', form.stuff_id);
    payload.append('imei_1', form.imei_1.trim());
    payload.append('imei_2', form.imei_2.trim());
    payload.append('sn', form.sn.trim());

    setDebugPayload(payload.toString());

    try {
      const res = await fetch(`${BASE_URL}/stock`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString(),
      });

      const json = await res.json();

      if (res.ok) {
        alert('Stock added successfully!');
        setShowModal(false);
        setForm({
          warehouse_id: '',
          stuff_id: '',
          imei_1: '',
          imei_2: '',
          sn: '',
        });
        loadStocks();
      } else {
        alert(json.message || 'Error');
      }
    } catch (err) {
      alert('Network error');
      console.error(err);
    }
  };

  // ================= UPLOAD CSV / EXCEL =================
  const submitUpload = async () => {
    if (!uploadFile) {
      alert('Pilih file terlebih dahulu');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);

    setDebugPayload(`UPLOAD FILE: ${uploadFile.name}`);

    try {
      const res = await fetch(`${BASE_URL}/upload-stock`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await res.json();

      if (res.ok) {
        alert('Upload stock berhasil');
        setShowUpload(false);
        setUploadFile(null);
        loadStocks();
      } else {
        alert(json.message || 'Upload gagal');
      }
    } catch (err) {
      alert('Upload error');
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Stock Management</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Upload
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            + Add Stock
          </button>
        </div>
      </div>

      {/* TABLE */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Warehouse</th>
            <th className="p-2 border">Product</th>
            <th className="p-2 border">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map(s => (
            <tr key={`${s.warehouse_id}-${s.stuff_id}`}>
              <td className="p-2 border">{s.warehouse_name}</td>
              <td className="p-2 border">{s.stuff_name}</td>
              <td className="p-2 border text-center">
                {s.total_stock}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* DEBUG */}
      {debugPayload && (
        <div className="mt-6 bg-black text-green-400 p-4 rounded text-sm relative">
          <button
            onClick={() => setDebugPayload(null)}
            className="absolute top-2 right-2 text-white text-xs"
          >
            ✕
          </button>
          <pre>{debugPayload}</pre>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-96 space-y-4">
            <h2 className="text-lg font-semibold">Upload Stock</h2>

            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={e =>
                setUploadFile(e.target.files?.[0] || null)
              }
            />

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowUpload(false)}
                className="border px-3 py-1"
              >
                Cancel
              </button>
              <button
                onClick={submitUpload}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MANUAL MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-96 space-y-3">
            <h2 className="text-lg font-semibold">Add Stock</h2>

            <select
              className="w-full border p-2"
              value={form.warehouse_id}
              onChange={e =>
                setForm({ ...form, warehouse_id: e.target.value })
              }
            >
              <option value="">Select Warehouse</option>
              {warehouseList.map(w => (
                <option
                  key={w.warehouse_id}
                  value={w.warehouse_id}
                >
                  {w.warehouse_name}
                </option>
              ))}
            </select>

            <select
              className="w-full border p-2"
              value={form.stuff_id}
              onChange={e =>
                setForm({ ...form, stuff_id: e.target.value })
              }
            >
              <option value="">Select Product</option>
              {stuffList.map(s => (
                <option
                  key={s.stuff_id}
                  value={s.stuff_id}
                >
                  {s.stuff_name}
                </option>
              ))}
            </select>

            <input
              placeholder="IMEI 1"
              className="w-full border p-2"
              value={form.imei_1}
              onChange={e =>
                setForm({ ...form, imei_1: e.target.value })
              }
            />
            <input
              placeholder="IMEI 2"
              className="w-full border p-2"
              value={form.imei_2}
              onChange={e =>
                setForm({ ...form, imei_2: e.target.value })
              }
            />
            <input
              placeholder="Serial Number"
              className="w-full border p-2"
              value={form.sn}
              onChange={e =>
                setForm({ ...form, sn: e.target.value })
              }
            />

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowModal(false)}
                className="border px-3 py-1"
              >
                Cancel
              </button>
              <button
                onClick={submitStock}
                className="bg-blue-600 text-white px-3 py-1 rounded"
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
