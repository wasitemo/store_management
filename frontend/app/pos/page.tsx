"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE_URL = "http://localhost:3000";

export default function OrderCreatePage() {
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

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

  /* ================= SEARCH ITEM ================= */
  const searchItem = async () => {
    setErrorMsg(null);

    if (!form.warehouse_id) {
      setErrorMsg("Warehouse wajib dipilih");
      return;
    }

    if (!searchValue) {
      setErrorMsg("Masukkan IMEI / SN / Barcode");
      return;
    }

    try {
      setSearchLoading(true);

      const params = new URLSearchParams({
        warehouse_id: form.warehouse_id,
        imei_1: searchValue,
      });

      const res = await fetch(`${BASE_URL}/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.message);
        return;
      }

      // Cegah duplicate
      const exists = form.items.some(
        (i: any) => i.identifier === searchValue,
      );

      if (exists) {
        setErrorMsg("Item sudah ada di order");
        return;
      }

      setForm((prev: any) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            stuff_id: json.result.stuff_id,
            stuff_name: json.result.stuff_name,
            warehouse_name: json.result.warehouse_name,
            total_stock: json.result.total_stock,
            identifier: searchValue,
          },
        ],
      }));

      setSearchValue("");
    } catch (err) {
      setErrorMsg("Gagal mencari item");
    } finally {
      setSearchLoading(false);
    }
  };

  /* ================= SUBMIT ================= */
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

    const payload = {
      ...form,
      items: form.items.map((i: any) => ({
        stuff_id: i.stuff_id,
        imei_1: i.identifier,
      })),
    };

    const res = await fetch(`${BASE_URL}/customer-order`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      setErrorMsg(json.message || "Gagal menyimpan order");
      return;
    }

    router.push("/order");
  };

  return (
    <div className="p-container-padding max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Order</h1>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* ================= MAIN FORM ================= */}
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

      {/* ================= SEARCH ITEM ================= */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Search Item</h3>
        <div className="flex gap-3">
          <input
            placeholder="IMEI / SN / Barcode"
            className="flex-1 border rounded px-4 py-3"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <button
            onClick={searchItem}
            disabled={searchLoading}
            className="bg-primary text-white px-6 rounded-lg"
          >
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* ================= ITEM TABLE ================= */}
      {form.items.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Items</h3>
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2">Product</th>
                <th className="border px-3 py-2">Variant</th>
                <th className="border px-3 py-2">Barcode</th>
                <th className="border px-3 py-2">Has SN</th>
                <th className="border px-3 py-2">Price</th>
                <th className="border px-3 py-2">Qty</th>
                <th className="border px-3 py-2">Stock</th>
                <th className="border px-3 py-2">Warehouse</th>
                <th className="border px-3 py-2">Identifier</th>
              </tr>
            </thead>

            <tbody>
              {form.items.map((item: any, i: number) => (
                <tr key={i}>
                  <td className="border px-3 py-2">{item.stuff_name}</td>
                  <td className="border px-3 py-2">{item.stuff_variant}</td>
                  <td className="border px-3 py-2">{item.barcode || "-"}</td>
                  <td className="border px-3 py-2 text-center">
                    {item.has_sn ? "Yes" : "No"}
                  </td>
                  <td className="border px-3 py-2 text-right">
                    {Number(item.current_sell_price).toLocaleString("id-ID")}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {item.qty}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {item.total_stock}
                  </td>
                  <td className="border px-3 py-2">
                    {item.warehouse_name}
                  </td>
                  <td className="border px-3 py-2">
                    {item.identifier}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}

      {/* ================= DISCOUNT ================= */}
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
