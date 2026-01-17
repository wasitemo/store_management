"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE_URL = "http://localhost:3001";

export default function ImeiSnPage() {
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState({ search: "", status: "" });

  const loadData = async () => {
    const res = await fetch(`${BASE_URL}/imei-sn`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      localStorage.removeItem("access_token");
      router.push("/login");
      return;
    }

    const json = await res.json();
    setData(json.data);
    setLoading(false);
  };

  useEffect(() => {
    if (!token) router.push("/login");
    else loadData();
  }, []);

  const filtered = data.filter((item) => {
    const matchSearch =
      item.stuff_name.toLowerCase().includes(filter.search.toLowerCase()) ||
      item.warehouse_name.toLowerCase().includes(filter.search.toLowerCase()) ||
      (item.imei_1 || "").includes(filter.search) ||
      (item.sn || "").includes(filter.search);

    const matchStatus = filter.status
      ? item.stock_status === filter.status
      : true;

    return matchSearch && matchStatus;
  });

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">IMEI & Serial Number</h1>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <input
          placeholder="Search stuff, warehouse, imei, sn..."
          className="input w-full"
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
        />

        <select
          className="input w-40"
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="ready">Ready</option>
          <option value="sold">Sold</option>
          <option value="return">Return</option>
        </select>
      </div>

      {/* Table */}
      <table className="w-full border rounded">
        <thead className="bg-surface">
          <tr>
            <th className="p-2 text-left">Stuff</th>
            <th className="p-2 text-left">Warehouse</th>
            <th className="p-2 text-left">IMEI 1</th>
            <th className="p-2 text-left">IMEI 2</th>
            <th className="p-2 text-left">Serial Number</th>
            <th className="p-2 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((item, i) => (
            <tr key={i} className="border-t hover:bg-surface-hover">
              <td className="p-2">{item.stuff_name}</td>
              <td className="p-2">{item.warehouse_name}</td>
              <td className="p-2 font-mono">{item.imei_1}</td>
              <td className="p-2 font-mono">{item.imei_2}</td>
              <td className="p-2 font-mono">{item.sn || "-"}</td>
              <td className="p-2">
                <span
                  className={`px-2 py-1 rounded text-xs text-white ${
                    item.stock_status === "ready"
                      ? "bg-success"
                      : item.stock_status === "sold"
                      ? "bg-danger"
                      : "bg-warning"
                  }`}
                >
                  {item.stock_status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
