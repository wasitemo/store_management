'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Brand {
  stuff_brand_id: number;
  stuff_brand_name: string;
}

const BASE_URL = 'http://localhost:3001';

export default function StuffBrandPage() {
  const router = useRouter();

  const [data, setData] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    stuff_brand_name: '',
  });

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;

  // ================= LOAD DATA =================
  const loadBrands = async () => {
    try {
      const res = await fetch(`${BASE_URL}/stuff-brands`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
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
    if (!token) router.push('/login');
    else loadBrands();
  }, []);

  // ================= FORM =================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ stuff_brand_name: '' });
    setShowModal(true);
  };

  const openEdit = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/stuff-brand/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      setEditingId(id);
      setForm({
        stuff_brand_name: json.data.stuff_brand_name,
      });

      setShowModal(true);
    } catch {
      alert('Gagal mengambil data brand');
    }
  };

  const submitForm = async () => {
    try {
      const body = new URLSearchParams();
      body.append('stuff_brand_name', form.stuff_brand_name);

      const endpoint =
        editingId === null
          ? `${BASE_URL}/stuff-brand`
          : `${BASE_URL}/stuff-brand/${editingId}`;

      const res = await fetch(endpoint, {
        method: editingId === null ? 'POST' : 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(text);
        alert('Server menolak permintaan');
        return;
      }

      setShowModal(false);
      await loadBrands();
    } catch (err) {
      console.error(err);
      alert('Gagal koneksi ke server');
    }
  };

  // ================= UI =================
  if (loading) return <p className="p-card-padding text-text-secondary">Loading...</p>;
  if (error) return <p className="p-card-padding text-danger">{error}</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold text-text-primary">Stuff Brands</h1>
        <button
          onClick={openAdd}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition"
        >
          + Add Brand
        </button>
      </div>

      <table className="w-full border border-border rounded text-center">
        <thead className="bg-surface">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Brand Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>

        <tbody className="bg-surface divide-y divide-border">
          {data.map((b) => (
            <tr
              key={b.stuff_brand_id}
              className="hover:bg-surface-hover transition-colors"
            >
              <td className="px-4 py-3 text-sm text-text-primary">
                {b.stuff_brand_id}
              </td>
              <td className="px-4 py-3 text-sm text-text-primary">
                {b.stuff_brand_name}
              </td>
              <td className="px-4 py-3 text-sm">
                <button
                  onClick={() => openEdit(b.stuff_brand_id)}
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
              {editingId ? 'Edit Brand' : 'Add Brand'}
            </h2>

            <input
              name="stuff_brand_name"
              placeholder="Brand Name"
              className="w-full border border-border p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
              value={form.stuff_brand_name}
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
