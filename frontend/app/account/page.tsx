"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../src/lib/api";


interface Employee {
  employee_id: number;
  employee_name: string;
}

interface EmployeeAccount {
  employee_account_id: number;
  employee_id: number;
  employee_name: string;
  username: string;
  role: string;
  account_status: string;
}

export default function EmployeeAccountsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  type SortKey =
    | "employee_account_id"
    | "employee_name"
    | "username"
    | "role"
    | "account_status";

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });
  const [accounts, setAccounts] = useState<EmployeeAccount[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    employee_id: "",
    username: "",
    password: "",
    role: "",
    account_status: "active",
  });

  // ================= LOAD =================
  const loadAccounts = async () => {
    const res = await apiFetch("/employee-account");

    if (res.status === 401) {
      // Token refresh handled by apiFetch, but if still 401, redirect
      localStorage.removeItem("access_token");
      router.push("/login");
      return;
    }

    const json = await res.json();
    setAccounts(json.data);
  };

  const loadEmployees = async () => {
    const res = await apiFetch("/employee");

    if (res.status === 401) {
      // Token refresh handled by apiFetch, but if still 401, redirect
      localStorage.removeItem("access_token");
      router.push("/login");
      return;
    }

    const json = await res.json();
    setEmployees(json.data);
  };


  useEffect(() => {
    Promise.all([loadAccounts(), loadEmployees()])
      .catch((err) => {
        setError("Gagal memuat data");
      })
      .finally(() => setLoading(false));
  }, []);


  // ================= FORM =================
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      employee_id: "",
      username: "",
      password: "",
      role: "",
      account_status: "active",
    });
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (acc: EmployeeAccount) => {
    setEditingId(acc.employee_account_id);
    setForm({
      employee_id: acc.employee_id.toString(),
      username: acc.username,
      password: "",
      role: acc.role,
      account_status: acc.account_status,
    });
    setFormError("");
    setShowModal(true);
  };

  const submitForm = async () => {
    setFormError("");

    if (!editingId) {
      if (!form.employee_id) return setFormError("Employee harus dipilih");
      if (!form.username) return setFormError("Username wajib diisi");
      if (!form.password) return setFormError("Password wajib diisi");
      if (!form.role) return setFormError("Role wajib diisi");

      if (accounts.some((a) => a.employee_id.toString() === form.employee_id)) {
        return setFormError("Employee ini sudah memiliki account");
      }
    }

    const body = new URLSearchParams();
    if (!editingId) {
      body.append("employee_id", form.employee_id);
      body.append("username", form.username);
      body.append("password", form.password);
      body.append("role", form.role);
    }
    body.append("account_status", form.account_status);

    const endpoint = editingId
      ? `/employee-account/${editingId}`
      : `/register`;


    const res = await apiFetch(endpoint, {
      method: editingId ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (res.status === 401) {
      // Token refresh handled by apiFetch, but if still 401, redirect
      localStorage.removeItem("access_token");
      router.push("/login");
      return;
    }

    const result = await res.json();

    if (!res.ok) {
      setFormError(result.message || "Gagal menyimpan data");
      return;
    }

    setShowModal(false);
    await loadAccounts();
  };

  // ================= UI =================
  if (loading)
    return (
      <div className="p-container-padding flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

  if (error)
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
  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filteredAccounts = accounts
    .filter((acc) => {
      const keyword = search.toLowerCase();

      return (
        acc.employee_account_id.toString().includes(keyword) ||
        acc.employee_name.toLowerCase().includes(keyword) ||
        acc.username.toLowerCase().includes(keyword) ||
        acc.role.toLowerCase().includes(keyword) ||
        acc.account_status.toLowerCase().includes(keyword)
      );
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;

      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (typeof aVal === "number") {
        return sortConfig.direction === "asc"
          ? aVal - (bVal as number)
          : (bVal as number) - aVal;
      }

      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  return (
    <div className="p-container-padding">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">
          Employee Accounts
        </h1>
        <p className="text-text-secondary mt-2">
          Manage employee account access and permissions
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search anything..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary"
          />

          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
            🔍
          </span>
        </div>

        <button
          onClick={openAdd}
          className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition flex items-center shadow-sm"
        >
          <span className="mr-2">+</span>
          Add Account
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface-hover">
              <tr>
                <th
                  onClick={() => handleSort("employee_account_id")}
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer select-none"
                >
                  Account ID {sortConfig.key === "employee_account_id" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                <th onClick={() => handleSort("employee_name")} className="... cursor-pointer">
                  Employee {sortConfig.key === "employee_name" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                <th onClick={() => handleSort("username")} className="... cursor-pointer">
                  Username {sortConfig.key === "username" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("role")} className="... cursor-pointer">
                  Role {sortConfig.key === "role" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                <th onClick={() => handleSort("account_status")} className="... cursor-pointer">
                  Status {sortConfig.key === "account_status" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>

                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-surface divide-y divide-border">
              {filteredAccounts.map((acc) => (
                <tr
                  key={acc.employee_account_id}
                  className="hover:bg-surface-hover transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                    {acc.employee_account_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {acc.employee_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {acc.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                    {acc.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${acc.account_status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                        }`}
                    >
                      {acc.account_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openEdit(acc)}
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

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary">
                  {editingId ? "Edit Account Status" : "Create Account"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="mb-4 bg-danger/10 border border-danger text-danger px-4 py-3 rounded-lg">
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">⚠️</span>
                    <span>{formError}</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {!editingId && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Employee
                      </label>
                      <select
                        name="employee_id"
                        value={form.employee_id}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                      >
                        <option value="">-- Select Employee --</option>
                        {employees.map((emp) => (
                          <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.employee_id} - {emp.employee_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Username
                      </label>
                      <input
                        name="username"
                        placeholder="Enter username"
                        className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                        value={form.username}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Password
                      </label>
                      <input
                        name="password"
                        type="password"
                        placeholder="Enter password"
                        className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                        value={form.password}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Role
                      </label>
                      <input
                        name="role"
                        placeholder="Enter role"
                        className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                        value={form.role}
                        onChange={handleChange}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Account Status
                  </label>
                  <select
                    name="account_status"
                    value={form.account_status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary bg-surface transition-all"
                  >
                    <option value="active">Active</option>
                    <option value="non-active">Inactive</option>
                  </select>
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
                  onClick={submitForm}
                  className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary-dark transition shadow-sm"
                >
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
