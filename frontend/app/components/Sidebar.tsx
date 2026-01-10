"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/* =======================
   MENU CONFIG + STATUS
======================= */
const menus = [
  { name: "Dashboard", path: "/dashboard", icon: "📊", status: "ok" },
  { name: "Account", path: "/account", icon: "👤", status: "ok" },
  { name: "Employee", path: "/employee", icon: "👥", status: "ok" },
  { name: "Warehouse", path: "/warehouse", icon: "🏭", status: "ok" },
  { name: "Supplier", path: "/supplier", icon: "📦", status: "ok" },
  { name: "Customer", path: "/customer", icon: "👥", status: "ok" },
  { name: "Payment Method", path: "/payment-method", icon: "💳", status: "ok" },

  {
    name: "Stuff",
    icon: "📦",
    children: [
      { name: "Stuff", path: "/stuff", icon: "📦", status: "fix" },
      { name: "Stuff Brand", path: "/stuff-brand", icon: "🏷️", status: "ok" },
      { name: "Stuff Category", path: "/stuff-category", icon: "🗂️", status: "ok" },
      { name: "Stuff Purchase", path: "/stuff-purchase", icon: "📥", status: "fix" },
    ],
  },

  { name: "Imei", path: "/imei-sn", icon: "📱", status: "ok" },

  {
    name: "Discounts",
    icon: "💰",
    children: [
      { name: "Stuff Discount", path: "/stuff-discount", icon: "🏷️", status: "fix" },
      { name: "Order Discount", path: "/order-discount", icon: "🏷️", status: "fix" },
    ],
  },

  { name: "Stock", path: "/stock", icon: "📈", status: "ok" },
  { name: "Order", path: "/order", icon: "🛒", status: "fix" },
];

/* =======================
   STATUS DOT
======================= */
const StatusDot = ({ status }: { status?: string }) => {
  if (!status) return null;

  return (
    <span
      className={`w-2.5 h-2.5 rounded-full ${
        status === "ok" ? "bg-green-500" : "bg-red-500"
      }`}
      title={status === "ok" ? "Stable" : "Needs Fix"}
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
    <aside className="w-64 min-h-screen bg-sidebar-bg border-r border-border flex flex-col shadow-lg z-10">

      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-lg">I</span>
          </div>
          <h1 className="text-xl font-bold text-text-primary">InventoryPro</h1>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menus.map((menu) => {
            if ("children" in menu && menu.children) {
              const isOpen = openMenu === menu.name;
              const isActive = menu.children.some(
                (child) => child.path === pathname
              );

              return (
                <li key={menu.name}>
                  <button
                    onClick={() => toggleMenu(menu.name)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-all
                      ${isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                      }`}
                  >
                    <span className="mr-3 text-lg">{menu.icon}</span>
                    <span className="flex-1">{menu.name}</span>
                    <StatusDot status={menu.status} />
                    <span
                      className={`ml-3 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                    >
                      ▶
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mt-2 space-y-1 pl-4">
                      {menu.children.map((child) => {
                        const active = pathname === child.path;

                        return (
                          <Link
                            key={child.path}
                            href={child.path}
                            className={`flex items-center px-4 py-2.5 rounded-lg text-sm transition-all
                              ${active
                                ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                                : "text-text-secondary/80 hover:bg-surface-hover hover:text-text-primary"
                              }`}
                          >
                            <span className="mr-2 text-sm">{child.icon}</span>
                            <span className="flex-1">{child.name}</span>
                            <StatusDot status={child.status} />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            }

            const active = pathname === menu.path;

            return (
              <li key={menu.path}>
                <Link
                  href={menu.path}
                  className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all
                    ${active
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    }`}
                >
                  <span className="mr-3 text-lg">{menu.icon}</span>
                  <span className="flex-1">{menu.name}</span>
                  <StatusDot status={menu.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border text-xs text-text-muted/70">
        <p>© {new Date().getFullYear()} InventoryPro</p>
      </div>
    </aside>
  );
}
