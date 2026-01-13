'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BASE_URL = 'http://localhost:3001';

export default function OrderPage() {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const [orders, setOrders] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [master, setMaster] = useState<any>({
    customer: [],
    warehouse: [],
    payment_method: [],
    stuff: [],
    order_discount: []
  });

  const [form, setForm] = useState<any>({
    customer_id: '',
    warehouse_id: '',
    payment_method_id: '',
    order_date: '',
    payment: '',
    items: [],
    discounts: []
  });

  useEffect(() => {
    if (!token) router.push('/login');
    else {
      loadOrders();
      loadMaster();
    }
  }, []);

  const loadOrders = async () => {
    const res = await fetch(`${BASE_URL}/customer-orders`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    setOrders(json.data || []);
  };

  const loadMaster = async () => {
    const res = await fetch(`${BASE_URL}/customer-order`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    setMaster(json.data);
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { stuff_id: '', imei_1: '', imei_2: '', sn: '', barcode: '' }] });
  };

const submitOrder = async () => {
  setErrorMsg(null);
if (!form.customer_id || !form.warehouse_id || !form.payment_method_id) {
  setErrorMsg('Customer, Warehouse, dan Payment Method wajib dipilih');
  return;
}

if (!form.items.length) {
  setErrorMsg('Minimal harus ada 1 item');
  return;
}

for (let i = 0; i < form.items.length; i++) {
  const item = form.items[i];

  if (!item.stuff_id) {
    setErrorMsg(`Item ke-${i + 1}: Product wajib dipilih`);
    return;
  }

  if (!item.imei_1 && !item.imei_2 && !item.sn) {
    setErrorMsg(`Item ke-${i + 1}: IMEI / SN wajib diisi`);
    return;
  }
}

  const res = await fetch(`${BASE_URL}/customer-order`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(form)
  });

  const json = await res.json();

  if (!res.ok) {
    setErrorMsg(json.message || 'Unknown error occurred');
    return;
  }

  setShowModal(false);
  setForm({
    customer_id: '',
    warehouse_id: '',
    payment_method_id: '',
    order_date: '',
    payment: '',
    items: [],
    discounts: []
  });

  loadOrders();
};


  return (
    <div className="p-container-padding">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Orders</h1>
        <p className="text-text-secondary mt-2">Manage customer orders and transactions</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">🔍</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition flex items-center shadow-sm"
        >
          <span className="mr-2">+</span>
          New Order
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-hover">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">DATE</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">CUSTOMER</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">PAYMENT</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">TOTAL</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">REMAINING</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {orders.map(o => (
                <tr key={o.order_id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4 text-sm whitespace-nowrap">{o.order_date}</td>
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">{o.customer_name}</td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">{o.payment_method_name}</td>
                  <td className="px-6 py-4 text-sm text-right whitespace-nowrap">{o.sub_total}</td>
                  <td className="px-6 py-4 text-sm text-right whitespace-nowrap">{o.remaining_payment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-4xl border border-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary">Create Order</h2>
                {errorMsg && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    ⚠️ {errorMsg}
                  </div>
                )}

                <button
                  onClick={() => setShowModal(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>

              {/* Main Form */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  ['Customer', 'customer_id', master.customer],
                  ['Warehouse', 'warehouse_id', master.warehouse],
                  ['Payment Method', 'payment_method_id', master.payment_method]
                ].map(([label, key, list]: any) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      {label}
                    </label>
                    <select
                      className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                    >
                      <option value="">Select {label}</option>
                      {list.map((i: any) => (
                        <option key={`${key}-${i[Object.keys(i)[0]]}`} value={i[Object.keys(i)[0]]}>
                          {i[Object.keys(i)[1]]}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Order Date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    onChange={e => setForm({ ...form, order_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Payment
                  </label>
                  <input
                    placeholder="Enter payment amount"
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                    onChange={e => setForm({ ...form, payment: e.target.value })}
                  />
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-text-primary">Items</h3>
                  <button
                    onClick={addItem}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition text-sm"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {form.items.map((item: any, i: number) => (
                    <div key={i} className="grid grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Product
                        </label>
                        <select
                          className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                          onChange={e => item.stuff_id = e.target.value}
                        >
                          <option value="">Select Product</option>
                          {master.stuff.map((s: any) => (
                            <option key={s.stuff_id} value={s.stuff_id}>{s.stuff_name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          IMEI 1
                        </label>
                        <input
                          className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                          placeholder="IMEI 1"
                          onChange={e => item.imei_1 = e.target.value}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          IMEI 2
                        </label>
                        <input
                          className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                          placeholder="IMEI 2"
                          onChange={e => item.imei_2 = e.target.value}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          SN
                        </label>
                        <input
                          className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                          placeholder="Serial Number"
                          onChange={e => item.sn = e.target.value}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Barcode
                        </label>
                        <input
                          className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                          placeholder="Barcode"
                          onChange={e => item.barcode = e.target.value}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discounts */}
              <div className="mb-6">
                <h3 className="font-semibold text-text-primary mb-4">Order Discounts</h3>
                <div className="grid grid-cols-2 gap-3">
                  {master.order_discount.map((d: any) => (
                    <label key={d.discount_id} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-surface-hover transition">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                        onChange={e => e.target.checked && setForm({ ...form, discounts: [...form.discounts, { discount_id: d.discount_id }] })}
                      />
                      <span>{d.discount_name}</span>
                    </label>
                  ))}
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
                  onClick={submitOrder}
                  className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition shadow-sm"
                >
                  Save Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
