"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

/* =======================
   TYPES
======================= */
type StatusType = "ok" | "clear" | "fix";

type MenuItem = {
  name: string;
  path?: string;
  icon: string;
  status?: StatusType;
  children?: MenuItem[];
};

/* =======================
   MENU CONFIG
======================= */
const menus: MenuItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: "📈", status: "clear" },
  { name: "Account", path: "/account", icon: "👤", status: "clear" },
  { name: "Employee", path: "/employee", icon: "🧑‍💼", status: "clear" },
  { name: "Warehouse", path: "/warehouse", icon: "🏢", status: "clear" },
  { name: "Supplier", path: "/supplier", icon: "🚚", status: "clear" },
  { name: "Customer", path: "/customer", icon: "🧑‍🤝‍🧑", status: "clear" },
  { name: "Payment Method", path: "/payment-method", icon: "💳", status: "clear" },

  {
    name: "Stuff",
    icon: "📦",
    status: "clear",
    children: [
      { name: "Stuff", path: "/stuff", icon: "📦", status: "clear" },
      { name: "Stuff Brand", path: "/stuff-brand", icon: "🏷️", status: "clear" },
      { name: "Stuff Category", path: "/stuff-category", icon: "🗂️", status: "clear" },
      { name: "Stuff Purchase", path: "/stuff-purchase", icon: "🧾", status: "clear" },
    ],
  },

  { name: "IMEI & SN", path: "/imei-sn", icon: "📱", status: "clear" },

  {
    name: "Discounts",
    icon: "💸",
    status: "clear",
    children: [
      { name: "Stuff Discount", path: "/stuff-discount", icon: "🏷️", status: "clear" },
      { name: "Order Discount", path: "/order-discount", icon: "🧮", status: "clear" },
    ],
  },

  { name: "Stock", path: "/stock", icon: "📊", status: "clear" },

  {
    name: "Order",
    icon: "🛒",
    status: "clear",
    children: [
      { name: "Order", path: "/order", icon: "🧾", status: "clear" },
      { name: "POS", path: "/pos", icon: "💰", status: "clear" },
    ],
  },
];

/* =======================
   STATUS DOT
======================= */
const StatusDot = ({ status }: { status?: StatusType }) => {
  if (!status || status === "clear") return null;

  return (
    <span
      className={`w-2.5 h-2.5 rounded-full ${
        status === "ok" ? "bg-green-500" : "bg-red-500"
      }`}
      title={status === "ok" ? "OK" : "Needs Fix"}
    />
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const toggleMenu = (name: string) => {
    setOpenMenu(openMenu === name ? null : name);
  };

  /* =======================
     LOGOUT HANDLER
  ======================= */
  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      await fetch("http://localhost:3000/logout", {
        method: "POST",
        credentials: "include", // ⬅️ penting untuk clear refresh token cookie
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      // bersihkan access token di frontend
      localStorage.removeItem("access_token");

      // redirect ke login
      router.push("/login");
    }
  };

  return (
    <aside className="w-64 min-h-screen bg-sidebar-bg border-r border-border flex flex-col shadow-lg">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h1 className="text-xl font-bold">InventoryPro</h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {menus.map((menu) => {
            if (menu.children) {
              const isOpen = openMenu === menu.name;
              const isActive = menu.children.some(
                (child) => child.path === pathname
              );

              return (
                <li key={menu.name}>
                  <button
                    onClick={() => toggleMenu(menu.name)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl ${
                      isActive ? "bg-primary/10 text-primary" : ""
                    }`}
                  >
                    <span className="mr-3">{menu.icon}</span>
                    <span className="flex-1 text-left">{menu.name}</span>
                    <StatusDot status={menu.status} />
                    <span className={`ml-2 ${isOpen ? "rotate-90" : ""}`}>▶</span>
                  </button>

                  {isOpen && (
                    <div className="pl-4 space-y-1">
                      {menu.children.map((child) => (
                        <Link
                          key={child.path}
                          href={child.path!}
                          className={`flex items-center px-4 py-2 rounded-lg ${
                            pathname === child.path
                              ? "bg-primary/10 text-primary"
                              : ""
                          }`}
                        >
                          <span className="mr-2">{child.icon}</span>
                          <span className="flex-1">{child.name}</span>
                          <StatusDot status={child.status} />
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              );
            }

            return (
              <li key={menu.path}>
                <Link
                  href={menu.path!}
                  className={`flex items-center px-4 py-3 rounded-xl ${
                    pathname === menu.path
                      ? "bg-primary/10 text-primary"
                      : ""
                  }`}
                >
                  <span className="mr-3">{menu.icon}</span>
                  <span className="flex-1">{menu.name}</span>
                  <StatusDot status={menu.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-danger text-white hover:bg-danger-dark transition disabled:opacity-60"
        >
          <span>🚪</span>
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </aside>
  );
}
