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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [master, setMaster] = useState<any>({
    customer: [],
    warehouse: [],
    payment_method: [],
    order_discount: [],
    employee: [],
  });

  const [form, setForm] = useState<any>({
    customer_id: "",
    warehouse_id: "",
    payment_method_id: "",
    employee_id: "",
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
      employee_id: Number(form.employee_id),
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
    setLoading(true);
    setError("");
    try {
      const [customerRes, warehouseRes, paymentRes, discountRes, employeeRes] = await Promise.all([
        apiFetch("/customers"),
        apiFetch("/warehouse"),
        apiFetch("/payment-methods"),
        apiFetch("/order-discounts"),
        apiFetch("/employee-account"),
      ]);
      const customerJson = await customerRes.json();
      const warehouseJson = await warehouseRes.json();
      const paymentJson = await paymentRes.json();
      const discountJson = await discountRes.json();
      const employeeJson = await employeeRes.json();
      setMaster({
        customer: Array.isArray(customerJson.data) ? customerJson.data : [],
        warehouse: Array.isArray(warehouseJson.data) ? warehouseJson.data : [],
        payment_method: Array.isArray(paymentJson.data) ? paymentJson.data : [],
        order_discount: Array.isArray(discountJson.data) ? discountJson.data : [],
        employee: Array.isArray(employeeJson.data) ? employeeJson.data.map((emp: any) => ({
          employee_id: emp.employee_id,
          employee_name: emp.username,
        })) : [],
      });
    } catch (err) {
      setError("Failed to load master data");
    } finally {
      setLoading(false);
    }
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

    if (!form.customer_id || !form.warehouse_id || !form.payment_method_id || !form.employee_id) {
      setErrorMsg("Customer, Warehouse, Payment Method, and Employee wajib dipilih");
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

  // ================= UI =================
  if (loading) {
    return (
      <div className="p-container-padding flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-container-padding">
        <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <span className="mr-2 text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-container-padding max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Create Order</h1>
        <p className="text-text-secondary mt-2">Create a new customer order</p>
      </div>

      {errorMsg && (
        <div className="mb-4 bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <span className="mr-2 text-lg">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* ================= MAIN FORM ================= */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          ["Customer", "customer_id", master.customer],
          ["Warehouse", "warehouse_id", master.warehouse],
          ["Payment Method", "payment_method_id", master.payment_method],
          ["Employee", "employee_id", master.employee],
        ].map(([label, key, list]: any) => (
          <div key={key}>
            <label className="block text-sm font-medium text-text-secondary mb-2">{label}</label>
            <select
              className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
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
          <label className="block text-sm font-medium text-text-secondary mb-2">Order Date</label>
          <input
            type="date"
            className="w-full rounded-lg border border-border px-4 py-3 bg-surface text-text-primary cursor-not-allowed"
            value={form.order_date}
            disabled
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Payment</label>
          <input
            type="number"
            step="0.01"
            placeholder="Enter payment amount"
            className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
            value={form.payment}
            onChange={(e) => setForm({ ...form, payment: e.target.value })}
          />
        </div>
      </div>

      {/* ================= SEARCH ITEM ================= */}
      <div className="mb-6">
        <h3 className="font-semibold text-text-primary mb-2">Scan Item</h3>
        <div className="flex gap-3">
          <input
            placeholder="IMEI / SN / Barcode"
            className="flex-1 rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchItem()}
          />
          <button
            onClick={searchItem}
            disabled={searchLoading}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition shadow-sm"
          >
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* ================= ITEMS TABLE ================= */}
      {form.items.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-text-primary mb-3">Items</h3>
          <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-surface-hover">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Variant
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border">
                  {form.items.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {item.stuff_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                        {item.stuff_variant || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary text-right">
                        {Number(item.current_sell_price).toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <button
                          onClick={() => removeItem(index)}
                          className="text-danger hover:text-danger-dark"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* TOTAL */}
                  <tr className="font-semibold bg-surface-hover">
                    <td className="px-6 py-4 text-sm text-text-primary" colSpan={2}>
                      Total
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary text-right">
                      {totalPrice.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= DISCOUNTS ================= */}
      <div className="mb-6">
        <h3 className="font-semibold text-text-primary mb-3">Discounts</h3>
        <div className="grid grid-cols-3 gap-4">
          {master.order_discount.map((d: any) => (
            <label key={d.discount_id} className="flex gap-2 items-center">
              <input
                type="checkbox"
                className="rounded"
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
              <span className="text-sm text-text-secondary">{d.discount_name}</span>
            </label>
          ))}
        </div>
        {master.order_discount.length === 0 && (
          <div className="text-center text-text-secondary py-4">
            Tidak ada data
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={submitOrder}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition shadow-sm"
        >
          Save Order
        </button>
      </div>
    </div>
  );
}
