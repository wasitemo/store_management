"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE_URL = "http://localhost:3000";

export default function OrderCreatePage() {
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [master, setMaster] = useState<any>({
    customer: [],
    warehouse: [],
    payment_method: [],
    stuff: [],
    order_discount: [],
  });

  const [form, setForm] = useState<any>({
    customer_id: "",
    warehouse_id: "",
    payment_method_id: "",
    order_date: "",
    payment: "",
    items: [],
    discounts: [],
  });

  useEffect(() => {
    if (!token) router.push("/login");
    else loadMaster();
  }, []);

  const loadMaster = async () => {
    const res = await fetch(`${BASE_URL}/customer-order`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    setMaster(json.data);
  };

  const addItem = () => {
    setForm((prev: any) => ({
      ...prev,
      items: [
        ...prev.items,
        { stuff_id: "", imei_1: "", imei_2: "", sn: "", barcode: "" },
      ],
    }));
  };

  const updateItem = (index: number, key: string, value: string) => {
    const items = [...form.items];
    items[index][key] = value;
    setForm({ ...form, items });
  };

  const submitOrder = async () => {
    setErrorMsg(null);

    if (!form.customer_id || !form.warehouse_id || !form.payment_method_id) {
      setErrorMsg("Customer, Warehouse, dan Payment Method wajib dipilih");
      return;
    }

    if (!form.items.length) {
      setErrorMsg("Minimal harus ada 1 item");
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
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (!res.ok) {
      setErrorMsg(json.message || "Gagal menyimpan order");
      return;
    }

    router.push("/orders"); // optional redirect
  };

  return (
    <div className="p-container-padding max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Order</h1>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* MAIN FORM */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          ["Customer", "customer_id", master.customer],
          ["Warehouse", "warehouse_id", master.warehouse],
          ["Payment Method", "payment_method_id", master.payment_method],
        ].map(([label, key, list]: any) => (
          <div key={key}>
            <label className="block mb-2 text-sm">{label}</label>
            <select
              className="w-full border rounded-lg px-4 py-3"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            >
              <option value="">Select {label}</option>
              {list.map((i: any) => (
                <option
                  key={i[Object.keys(i)[0]]}
                  value={i[Object.keys(i)[0]]}
                >
                  {i[Object.keys(i)[1]]}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div>
          <label className="block mb-2 text-sm">Order Date</label>
          <input
            type="date"
            className="w-full border rounded-lg px-4 py-3"
            onChange={(e) =>
              setForm({ ...form, order_date: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block mb-2 text-sm">Payment</label>
          <input
            className="w-full border rounded-lg px-4 py-3"
            onChange={(e) => setForm({ ...form, payment: e.target.value })}
          />
        </div>
      </div>

      {/* ITEMS */}
      <div className="mb-6">
        <div className="flex justify-between mb-3">
          <h3 className="font-semibold">Items</h3>
          <button
            onClick={addItem}
            className="bg-primary text-white px-4 py-2 rounded-lg"
          >
            + Add Item
          </button>
        </div>

        {form.items.map((item: any, i: number) => (
          <div key={i} className="grid grid-cols-5 gap-3 mb-3">
            <select
              className="border rounded px-3 py-2"
              onChange={(e) => updateItem(i, "stuff_id", e.target.value)}
            >
              <option value="">Product</option>
              {master.stuff.map((s: any) => (
                <option key={s.stuff_id} value={s.stuff_id}>
                  {s.stuff_name}
                </option>
              ))}
            </select>

            <input
              placeholder="IMEI 1"
              className="border rounded px-3 py-2"
              onChange={(e) => updateItem(i, "imei_1", e.target.value)}
            />
            <input
              placeholder="IMEI 2"
              className="border rounded px-3 py-2"
              onChange={(e) => updateItem(i, "imei_2", e.target.value)}
            />
            <input
              placeholder="SN"
              className="border rounded px-3 py-2"
              onChange={(e) => updateItem(i, "sn", e.target.value)}
            />
            <input
              placeholder="Barcode"
              className="border rounded px-3 py-2"
              onChange={(e) => updateItem(i, "barcode", e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* DISCOUNTS */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Discounts</h3>
        <div className="grid grid-cols-2 gap-3">
          {master.order_discount.map((d: any) => (
            <label key={d.discount_id} className="flex gap-2 items-center">
              <input
                type="checkbox"
                onChange={(e) =>
                  e.target.checked &&
                  setForm({
                    ...form,
                    discounts: [
                      ...form.discounts,
                      { discount_id: d.discount_id },
                    ],
                  })
                }
              />
              {d.discount_name}
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={submitOrder}
          className="bg-primary text-white px-6 py-3 rounded-lg"
        >
          Save Order
        </button>
      </div>
    </div>
  );
}
