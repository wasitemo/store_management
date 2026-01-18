"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE_URL = "http://localhost:3000";

interface Purchase {
  stuff_purchase_id: number;
  supplier_name: string;
  buy_date: string;
  total_price: string;
}

interface Detail {
  stuff_purchase_id: number;
  supplier_name: string;
  employee_name: string;
  warehouse_name: string;
  stuff_name: string;
  buy_batch: string;
  buy_date: string;
  quantity: number;
  buy_price: string;
  total_price: string;
}

export default function StuffPurchasePage() {
  const router = useRouter();

  const [data, setData] = useState<Purchase[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);

  const [showDetail, setShowDetail] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const [form, setForm] = useState({
    supplier_id: "",
    warehouse_id: "",
    stuff_id: "",
    buy_date: "",
    buy_batch: "",
    quantity: "",
    buy_price: "",
    total_price: "",
  });

  const [file, setFile] = useState<File | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  // ================= LOAD =================
  const loadData = async () => {
    const res = await fetch(`${BASE_URL}/stuff-purchases`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });

    if (res.status === 401) return router.push("/login");

    const json = await res.json();
    setData(json.data);
  };

  useEffect(() => {
    if (!token) router.push("/login");
    else loadData();
  }, []);

  // ================= DETAIL =================
  const openDetail = async (id: number) => {
    const res = await fetch(`${BASE_URL}/stuff-purchase-detail/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });

    const json = await res.json();
    setDetail(json.data);
    setShowDetail(true);
  };

  // ================= MANUAL ADD =================
  const submitForm = async () => {
    const body = new URLSearchParams();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));

    const res = await fetch(`${BASE_URL}/stuff-purchase`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      credentials: "include",
    });

    if (!res.ok) {
      alert("Failed to save purchase");
      return;
    }

    setShowAdd(false);
    loadData();
  };

  // ================= UPLOAD =================
  const submitUpload = async () => {
    if (!file) return alert("Please select a file");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BASE_URL}/upload-stuff-purchase`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      credentials: "include",
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.message || "Upload failed");
      return;
    }

    alert("Upload success");
    setShowUpload(false);
    setFile(null);
    loadData();
  };

  return (
    <div className="p-6 space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Stuff Purchases</h1>
        <div className="space-x-2">
          <button
            onClick={() => setShowAdd(true)}
            className="bg-primary text-white px-4 py-2 rounded"
          >
            + Add Purchase
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-success text-white px-4 py-2 rounded"
          >
            Upload CSV / Excel
          </button>
        </div>
      </div>

      {/* TABLE */}
      <table className="w-full border">
        <thead>
          <tr className="border-b">
            <th className="p-2">ID</th>
            <th>Supplier</th>
            <th>Date</th>
            <th>Total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.stuff_purchase_id} className="border-b">
              <td className="p-2">{p.stuff_purchase_id}</td>
              <td>{p.supplier_name}</td>
              <td>{p.buy_date}</td>
              <td>{p.total_price}</td>
              <td>
                <button
                  onClick={() => openDetail(p.stuff_purchase_id)}
                  className="bg-warning text-white px-3 py-1 rounded"
                >
                  Detail
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* DETAIL MODAL */}
      {showDetail && detail && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-96 space-y-2">
            <h2 className="font-bold text-lg">Purchase Detail</h2>
            <p>Supplier: {detail.supplier_name}</p>
            <p>Employee: {detail.employee_name}</p>
            <p>Warehouse: {detail.warehouse_name}</p>
            <p>Stuff: {detail.stuff_name}</p>
            <p>Batch: {detail.buy_batch}</p>
            <p>Qty: {detail.quantity}</p>
            <p>Price: {detail.buy_price}</p>
            <p>Total: {detail.total_price}</p>

            <button
              onClick={() => setShowDetail(false)}
              className="w-full border py-2 mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MANUAL MODAL */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-96 space-y-2">
            <h2 className="font-bold text-lg">Add Purchase</h2>

            {Object.keys(form).map((key) => (
              <input
                key={key}
                placeholder={key}
                className="w-full border p-2"
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            ))}

            <div className="flex gap-2 pt-3">
              <button
                onClick={() => setShowAdd(false)}
                className="border w-1/2 py-2"
              >
                Cancel
              </button>
              <button
                onClick={submitForm}
                className="bg-primary text-white w-1/2 py-2"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-96 space-y-4">
            <h2 className="font-bold text-lg">Upload Purchase File</h2>

            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="w-full border p-2"
              onChange={(e) =>
                setFile(e.target.files ? e.target.files[0] : null)
              }
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowUpload(false)}
                className="border w-1/2 py-2"
              >
                Cancel
              </button>
              <button
                onClick={submitUpload}
                className="bg-success text-white w-1/2 py-2"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
