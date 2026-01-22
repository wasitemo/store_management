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
  const [error, setError] = useState("");

  const [filter, setFilter] = useState({ search: "", status: "" });

  type SortKey = "stuff_name" | "warehouse_name" | "imei_1" | "imei_2" | "sn" | "stock_status";

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/imei-sn");
      if (res.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }
      const json = await res.json();
      setData(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredAndSorted = data
    .filter((item) => {
      const matchSearch =
        (item.stuff_name || "").toLowerCase().includes(filter.search.toLowerCase()) ||
        (item.warehouse_name || "").toLowerCase().includes(filter.search.toLowerCase()) ||
        (item.imei_1 || "").includes(filter.search) ||
        (item.sn || "").includes(filter.search);

      const matchStatus = filter.status ? item.stock_status === filter.status : true;

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;

      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (typeof aVal === "number") {
        return sortConfig.direction === "asc" ? aVal - (bVal as number) : (bVal as number) - aVal;
      }

      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

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
    <div className="p-container-padding">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">IMEI & Serial Numbers</h1>
        <p className="text-text-secondary mt-2">Track and manage product identifiers</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
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
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="rounded-lg border border-border px-4 py-2.5 bg-surface focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
          >
            <option value="">All Status</option>
            <option value="ready">Ready</option>
            <option value="sold">Sold</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-hover">
              <tr>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("stuff_name")}
                >
                  <div className="flex items-center">
                    Stuff
                    {sortConfig.key === "stuff_name" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("warehouse_name")}
                >
                  <div className="flex items-center">
                    Warehouse
                    {sortConfig.key === "warehouse_name" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("imei_1")}
                >
                  <div className="flex items-center">
                    IMEI 1
                    {sortConfig.key === "imei_1" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("imei_2")}
                >
                  <div className="flex items-center">
                    IMEI 2
                    {sortConfig.key === "imei_2" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("sn")}
                >
                  <div className="flex items-center">
                    Serial Number
                    {sortConfig.key === "sn" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleSort("stock_status")}
                >
                  <div className="flex items-center">
                    Status
                    {sortConfig.key === "stock_status" && (
                      <span className="ml-1">
                        {sortConfig.direction === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border bg-surface">
              {filteredAndSorted.map((item, i) => (
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
              {filteredAndSorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-text-secondary">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
