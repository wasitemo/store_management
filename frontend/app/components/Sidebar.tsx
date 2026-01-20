"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { name: "Account", path: "/account", icon: "👤", status: "ok" },
  { name: "Employee", path: "/employee", icon: "🧑‍💼", status: "ok" },
  { name: "Warehouse", path: "/warehouse", icon: "🏢", status: "ok" },
  { name: "Supplier", path: "/supplier", icon: "🚚", status: "ok" },
  { name: "Customer", path: "/customer", icon: "🧑‍🤝‍🧑", status: "ok" },
  { name: "Payment Method", path: "/payment-method", icon: "💳", status: "ok" },

  {
    name: "Stuff",
    icon: "📦",
    status: "clear",
    children: [
      { name: "Stuff", path: "/stuff", icon: "📦", status: "ok" },
      { name: "Stuff Brand", path: "/stuff-brand", icon: "🏷️", status: "ok" },
      { name: "Stuff Category", path: "/stuff-category", icon: "🗂️", status: "ok" },
      { name: "Stuff Purchase", path: "/stuff-purchase", icon: "🧾", status: "fix" },
    ],
  },

  { name: "IMEI & SN", path: "/imei-sn", icon: "📱", status: "ok" },

  {
    name: "Discounts",
    icon: "💸",
    status: "clear",
    children: [
      { name: "Stuff Discount", path: "/stuff-discount", icon: "🏷️", status: "ok" },
      { name: "Order Discount", path: "/order-discount", icon: "🧮", status: "ok" },
    ],
  },

  { name: "Stock", path: "/stock", icon: "📊", status: "ok" },

  {
    name: "Order",
    icon: "🛒",
    status: "clear",
    children: [
      { name: "Order", path: "/order", icon: "🧾", status: "ok" },
      { name: "POS", path: "/pos", icon: "💰", status: "fix" },
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
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleMenu = (name: string) => {
    setOpenMenu(openMenu === name ? null : name);
  };

  return (
    <aside className="w-64 min-h-screen bg-sidebar-bg border-r border-border flex flex-col shadow-lg">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h1 className="text-xl font-bold">InventoryPro</h1>
      </div>

      <nav className="flex-1 py-4">
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
                    <span className="flex-1">{menu.name}</span>
                    <StatusDot status={menu.status} />
                    <span className={`ml-2 ${isOpen ? "rotate-90" : ""}`}>▶</span>
                  </button>

                  {isOpen && (
                    <div className="pl-4 space-y-1">
                      {menu.children.map((child) => (
                        <Link
                          key={child.path}
                          href={child.path!}
                          className="flex items-center px-4 py-2 rounded-lg"
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
                  className="flex items-center px-4 py-3 rounded-xl"
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
    </aside>
  );
}
