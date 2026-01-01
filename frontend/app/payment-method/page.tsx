'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentMethod {
  payment_method_id: number;
  payment_method_name: string;
}

const BASE_URL = 'http://localhost:3001';

export default function PaymentMethodPage() {
  const router = useRouter();

  const [data, setData] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    payment_method_name: '',
  });

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;

  // ================= LOAD DATA =================
  const loadPaymentMethods = async () => {
    try {
      const res = await fetch(`${BASE_URL}/payment-methods`, {
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
    else loadPaymentMethods();
  }, []);

  // ================= FORM =================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ payment_method_name: '' });
    setShowModal(true);
  };

  const openEdit = async (id: number) => {
    try {
      const res = await fetch(`${BASE_URL}/payment-method/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      setEditingId(id);
      setForm({
        payment_method_name: json.data.payment_method_name,
      });

      setShowModal(true);
    } catch {
      alert('Gagal mengambil data payment method');
    }
  };

  const submitForm = async () => {
    try {
      if (!form.payment_method_name.trim()) {
        alert('Nama payment method wajib diisi');
        return;
      }

      const body = new URLSearchParams();
      body.append('payment_method_name', form.payment_method_name);

      const endpoint =
        editingId === null
          ? `${BASE_URL}/payment-method`
          : `${BASE_URL}/payment-method/${editingId}`;

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
      await loadPaymentMethods();
    } catch (err) {
      console.error(err);
      alert('Gagal koneksi ke server');
    }
  };

  // ================= UI =================
  if (loading) return (
    <div className="p-container-padding flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  if (error) return (
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
        <h1 className="text-3xl font-bold text-text-primary">Payment Methods</h1>
        <p className="text-text-secondary mt-2">Manage available payment methods for transactions</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search payment methods..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">🔍</span>
        </div>
        <button
          onClick={openAdd}
          className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition flex items-center shadow-sm"
        >
          <span className="mr-2">+</span>
          Add Payment Method
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-hover">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-surface divide-y divide-border">
              {data.map((pm) => (
                <tr key={pm.payment_method_id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">{pm.payment_method_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{pm.payment_method_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openEdit(pm.payment_method_id)}
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
                  {editingId ? 'Edit Payment Method' : 'Add Payment Method'}
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
                    Payment Method Name
                  </label>
                  <input
                    name="payment_method_name"
                    placeholder="Enter payment method name"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.payment_method_name}
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
