'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BASE_URL = 'http://localhost:3001';

export default function StuffPage() {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const [stuffs, setStuffs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [imei, setImei] = useState<any[]>([]);

  const [meta, setMeta] = useState<any>({ stuff_category: [], stuff_brand: [], supplier: [] });

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState<any>({
    stuff_name: '',
    stuff_variant: '',
    stuff_sku: '',
    current_sell_price: '',
    has_sn: false,
    barcode: '',
    stuff_category_id: '',
    stuff_brand_id: '',
    supplier_id: '',
  });

  // ================= LOAD =================
  const loadAll = async () => {
    const headers = { Authorization: `Bearer ${token}` };

    const [a, b, c, d] = await Promise.all([
      fetch(`${BASE_URL}/stuffs`, { headers }),
      fetch(`${BASE_URL}/stuff-history`, { headers }),
      fetch(`${BASE_URL}/imei-sn`, { headers }),
      fetch(`${BASE_URL}/stuff`, { headers }),
    ]);

    setStuffs((await a.json()).data);
    setHistory((await b.json()).data);
    setImei((await c.json()).data);
    setMeta((await d.json()).data);
  };

  useEffect(() => {
    if (!token) router.push('/login');
    else loadAll();
  }, []);

  // ================= SAVE =================
  const save = async () => {
    const body = new URLSearchParams();
    Object.keys(form).forEach(k => body.append(k, String(form[k])));

    const url = editId ? `${BASE_URL}/stuff/${editId}` : `${BASE_URL}/stuff`;
    const method = editId ? 'PUT' : 'POST';

    await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body });

    setShowForm(false);
    setEditId(null);
    loadAll();
  };

  // ================= EDIT =================
  const edit = async (id: number) => {
    const res = await fetch(`${BASE_URL}/stuff/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    setForm(json.data);
    setShowForm(true);
    setEditId(id);
  };

  return (
    <div className="p-container-padding">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Stuff Management</h1>
        <p className="text-text-secondary mt-2">Manage your product inventory and details</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">🔍</span>
        </div>
        <button
          onClick={() => { setForm({}); setShowForm(true); }}
          className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition flex items-center shadow-sm"
        >
          <span className="mr-2">+</span>
          Add Product
        </button>
      </div>

      {/* ================= LIST ================= */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-hover">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Brand</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Supplier</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">SN</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {stuffs.map(s => (
                <tr key={s.stuff_id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">{s.stuff_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{s.stuff_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{s.stuff_category_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{s.stuff_brand_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{s.supplier_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{s.current_sell_price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">{String(s.has_sn)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => edit(s.stuff_id)}
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

      {/* ================= FORM ================= */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary">
                  {editId ? 'Edit Product' : 'Add Product'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Product Name
                  </label>
                  <input
                    placeholder="Enter product name"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.stuff_name || ''}
                    onChange={e => setForm({ ...form, stuff_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Variant
                  </label>
                  <input
                    placeholder="Enter variant"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.stuff_variant || ''}
                    onChange={e => setForm({ ...form, stuff_variant: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    SKU
                  </label>
                  <input
                    placeholder="Enter SKU"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.stuff_sku || ''}
                    onChange={e => setForm({ ...form, stuff_sku: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Price
                  </label>
                  <input
                    placeholder="Enter price"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.current_sell_price || ''}
                    onChange={e => setForm({ ...form, current_sell_price: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Category
                    </label>
                    <select
                      value={form.stuff_category_id || ''}
                      onChange={e => setForm({ ...form, stuff_category_id: e.target.value })}
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    >
                      <option value="">Select</option>
                      {meta.stuff_category.map((c: any) => <option key={c.stuff_category_id} value={c.stuff_category_id}>{c.stuff_category_name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Brand
                    </label>
                    <select
                      value={form.stuff_brand_id || ''}
                      onChange={e => setForm({ ...form, stuff_brand_id: e.target.value })}
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    >
                      <option value="">Select</option>
                      {meta.stuff_brand.map((b: any) => <option key={b.stuff_brand_id} value={b.stuff_brand_id}>{b.stuff_brand_name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Supplier
                    </label>
                    <select
                      value={form.supplier_id || ''}
                      onChange={e => setForm({ ...form, supplier_id: e.target.value })}
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    >
                      <option value="">Select</option>
                      {meta.supplier.map((s: any) => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.has_sn || false}
                    onChange={e => setForm({ ...form, has_sn: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                  />
                  <label className="ml-2 block text-sm text-text-secondary">
                    Has Serial Number
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Barcode
                  </label>
                  <input
                    placeholder="Enter barcode"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    value={form.barcode || ''}
                    onChange={e => setForm({ ...form, barcode: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-lg border border-border text-text-primary hover:bg-surface-hover transition"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition shadow-sm"
                >
                  {editId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
