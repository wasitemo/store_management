"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../src/lib/api";

const today = new Date().toISOString().split("T")[0];

export default function OrderCreatePage() {
  const router = useRouter();
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const [master, setMaster] = useState<any>({
    customer: [],
    warehouse: [],
    payment_method: [],
    order_discount: [],
  });

  const [form, setForm] = useState<any>({
    customer_id: "",
    warehouse_id: "",
    payment_method_id: "",
    order_date: today, // 🔒 lock hari ini
    payment: "",
    items: [],
    discounts: [],
  });

  /* ================= PAYLOAD FINAL ================= */
  const orderPayload = useMemo(() => {
    return {
      customer_id: Number(form.customer_id),
      warehouse_id: Number(form.warehouse_id),
      payment_method_id: Number(form.payment_method_id),
      order_date: form.order_date,
      payment: Number(form.payment || 0),
      discounts: form.discounts.map((d: any) => ({
        discount_id: Number(d.discount_id),
      })),
      items: form.items.map((i: any) => ({
        stuff_id: i.stuff_id,
        imei_1: i.matched_by === "imei_1" ? i.identifier : "",
        imei_2: i.matched_by === "imei_2" ? i.identifier : "",
        sn: i.matched_by === "sn" ? i.identifier : "",
        barcode: i.matched_by === "barcode" ? i.identifier : "",
      })),
    };
  }, [form]);

  /* ================= TOTAL HARGA ================= */
  const totalPrice = useMemo(() => {
    return form.items.reduce((sum: number, item: any) => {
      return sum + Number(item.current_sell_price || 0);
    }, 0);
  }, [form.items]);

  /* ================= LOAD MASTER ================= */
  useEffect(() => {
    loadMaster();
  }, []);

  const loadMaster = async () => {
    const res = await apiFetch("/customer-order");

    if (res.status === 401) {
      // Token refresh handled by apiFetch, but if still 401, redirect
      localStorage.removeItem("access_token");
      router.push("/login");
      return;
    }

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

    if (!searchValue.trim()) {
      setErrorMsg("Masukkan IMEI / SN / Barcode");
      return;
    }

    try {
      setSearchLoading(true);

      const params = new URLSearchParams({
        warehouse_id: form.warehouse_id,
        identify: searchValue,
      });

      const res = await apiFetch(`/search?${params.toString()}`);

      if (res.status === 401) {
        // Token refresh handled by apiFetch, but if still 401, redirect
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.message);
        return;
      }

      const existsStuff = form.items.some(
        (i: any) => i.stuff_id === json.result.stuff_id,
      );

      if (existsStuff) {
        setErrorMsg(
          `Produk "${json.result.stuff_name}" sudah ada di order`,
        );
        return;
      }

      setForm((prev: any) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            stuff_id: json.result.stuff_id,
            stuff_name: json.result.stuff_name,
            stuff_variant: json.result.stuff_variant,
            current_sell_price: json.result.current_sell_price, // ✅ FIX
            identifier: searchValue,
            matched_by: json.result.matched_by,
          },
        ],
      }));

      setSearchValue("");
    } catch {
      setErrorMsg("Gagal mencari item");
    } finally {
      setSearchLoading(false);
    }
  };

  const removeItem = (index: number) => {
    setForm((prev: any) => ({
      ...prev,
      items: prev.items.filter((_: any, i: number) => i !== index),
    }));
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

    const res = await apiFetch("/customer-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    if (res.status === 401) {
      // Token refresh handled by apiFetch, but if still 401, redirect
      localStorage.removeItem("access_token");
      router.push("/login");
      return;
    }

    const json = await res.json();

    if (!res.ok) {
      setErrorMsg(json.message || "Gagal menyimpan order");
      return;
    }
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
            className="w-full border rounded-lg px-4 py-3 bg-gray-100 cursor-not-allowed"
            value={form.order_date}
            disabled
          />
        </div>

        <div>
          <label className="block mb-2 text-sm">Payment</label>
          <input
            className="w-full border rounded-lg px-4 py-3"
            value={form.payment}
            onChange={(e) => setForm({ ...form, payment: e.target.value })}
          />
        </div>
      </div>

      {/* ================= SEARCH ITEM ================= */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Scan Item</h3>
        <div className="flex gap-3">
          <input
            placeholder="IMEI / SN / Barcode"
            className="flex-1 border rounded px-4 py-3"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchItem()}
          />
          <button
            onClick={searchItem}
            disabled={searchLoading}
            className="bg-primary text-white px-6 rounded"
          >
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* ================= ITEMS TABLE ================= */}
      {form.items.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Items</h3>

          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Nama</th>
                <th className="border p-2 text-left">Varian</th>
                <th className="border p-2 text-right">Harga</th>
                <th className="border p-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="border p-2">{item.stuff_name}</td>
                  <td className="border p-2">
                    {item.stuff_variant || "-"}
                  </td>
                  <td className="border p-2 text-right">
                    {Number(item.current_sell_price).toLocaleString("id-ID")}
                  </td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}

              {/* TOTAL */}
              <tr className="font-semibold bg-gray-50">
                <td className="border p-2" colSpan={2}>
                  Total
                </td>
                <td className="border p-2 text-right">
                  {totalPrice.toLocaleString("id-ID")}
                </td>
                <td className="border p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ================= DISCOUNTS ================= */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Discounts</h3>
        <div className="grid grid-cols-2 gap-3">
          {master.order_discount.map((d: any) => (
            <label key={d.discount_id} className="flex gap-2 items-center">
              <input
                type="checkbox"
                checked={form.discounts.some(
                  (x: any) => x.discount_id === d.discount_id,
                )}
                onChange={(e) => {
                  if (e.target.checked) {
                    setForm({
                      ...form,
                      discounts: [
                        ...form.discounts,
                        { discount_id: d.discount_id },
                      ],
                    });
                  } else {
                    setForm({
                      ...form,
                      discounts: form.discounts.filter(
                        (x: any) => x.discount_id !== d.discount_id,
                      ),
                    });
                  }
                }}
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
