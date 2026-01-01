"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/* =======================
   MENU CONFIG (WAJIB ADA)
======================= */
const menus = [
  { name: "Dashboard", path: "/dashboard", icon: "📊" },
  { name: "Account", path: "/account", icon: "👤" },
  { name: "Employee", path: "/employee", icon: "👥" },
  { name: "Warehouse", path: "/warehouse", icon: "🏭" },
  { name: "Supplier", path: "/supplier", icon: "📦" },
  { name: "Customer", path: "/customer", icon: "👥" },
  { name: "Payment Method", path: "/payment-method", icon: "💳" },
  {
    name: "Stuff",
    icon: "📦",
    children: [
      { name: "Stuff", path: "/stuff", icon: "📦" },
      { name: "Stuff Brand", path: "/stuff-brand", icon: "🏷️" },
      { name: "Stuff Category", path: "/stuff-category", icon: "🗂️" },
      { name: "Stuff Purchase", path: "/stuff-purchase", icon: "📥" },
    ],
  },
  { name: "Imei", path: "/imei-sn", icon: "📱" },
  {
    name: "Discounts",
    icon: "💰",
    children: [
      { name: "Stuff Discount", path: "/stuff-discount", icon: "🏷️" },
      { name: "Order Discount", path: "/order-discount", icon: "🏷️" },
    ],
  },
  { name: "Stock", path: "/stock", icon: "📈" },
  { name: "Order", path: "/order", icon: "🛒" },
];

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
                    className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200
                      ${isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                      }`}
                  >
                    <span className="mr-3 text-lg">{menu.icon}</span>
                    <span className="flex-1">{menu.name}</span>
                    <span
                      className={`transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
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
                            {child.name}
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
                  {menu.name}
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
