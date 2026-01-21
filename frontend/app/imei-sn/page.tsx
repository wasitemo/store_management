"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../src/lib/api";

export default function ImeiSnPage() {
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState({ search: "", status: "" });

  const loadData = async () => {
    const res = await apiFetch("/imei-sn");

    if (res.status === 401) {
      // Token refresh handled by apiFetch, but if still 401, redirect
      localStorage.removeItem("access_token");
      router.push("/login");
      return;
    }

    const json = await res.json();
    setData(json.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
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

  if (loading)
    return (
      <div className="p-container-padding flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

  return (
    <div className="p-container-padding">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">IMEI & Serial Numbers</h1>
        <p className="text-text-secondary mt-2">Track and manage product identifiers</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search stuff, warehouse, imei, sn..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary"
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
            🔍
          </span>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-hover">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Stuff
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  IMEI 1
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  IMEI 2
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Serial Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border bg-surface">
              {filtered.map((item, i) => (
                <tr key={i} className="hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {item.stuff_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {item.warehouse_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-mono">
                    {item.imei_1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-mono">
                    {item.imei_2}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-mono">
                    {item.sn || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        item.stock_status === "ready"
                          ? "bg-success/10 text-success"
                          : item.stock_status === "sold"
                            ? "bg-danger/10 text-danger"
                            : "bg-warning/10 text-warning"
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
      </div>
    </div>
  );
}
