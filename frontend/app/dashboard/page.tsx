'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');

    if (!storedToken) {
      router.push('/login');
      return;
    }

    setToken(storedToken);
  }, [router]);

  return (
    <div className="p-container-padding">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-2">Welcome back! Here's what's happening with your inventory today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-surface rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-primary/10 text-primary mr-4">
              <span className="text-xl">📦</span>
            </div>
            <div>
              <p className="text-text-secondary text-sm">Total Products</p>
              <p className="text-2xl font-bold text-text-primary">1,248</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-success/10 text-success mr-4">
              <span className="text-xl">📈</span>
            </div>
            <div>
              <p className="text-text-secondary text-sm">In Stock</p>
              <p className="text-2xl font-bold text-text-primary">982</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-warning/10 text-warning mr-4">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <p className="text-text-secondary text-sm">Low Stock</p>
              <p className="text-2xl font-bold text-text-primary">124</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl p-6 border border-border shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-danger/10 text-danger mr-4">
              <span className="text-xl">📉</span>
            </div>
            <div>
              <p className="text-text-secondary text-sm">Out of Stock</p>
              <p className="text-2xl font-bold text-text-primary">42</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl p-6 border border-border shadow-sm">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Account Information</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-text-secondary">Status</span>
              <span className="px-3 py-1 rounded-full bg-success/10 text-success text-sm">Active</span>
            </div>

            <div className="pb-3 border-b border-border">
              <span className="text-text-secondary block mb-1">Access Token</span>

              <div className="bg-surface-hover px-3 py-2 rounded text-text-secondary text-xs break-all select-text">
                {token ?? "N/A"}
              </div>
            </div>


            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-text-secondary">Last Login</span>
              <span className="text-text-primary">Today, 09:30 AM</span>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('access_token');
              router.push('/login');
            }}
            className="mt-6 w-full bg-danger text-white py-3 rounded-lg hover:bg-danger-dark transition shadow-sm flex items-center justify-center"
          >
            <span className="mr-2">🚪</span>
            Logout
          </button>
        </div>

        <div className="bg-surface rounded-xl p-6 border border-border shadow-sm">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Activity</h2>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="p-2 rounded-full bg-primary/10 text-primary mr-3 mt-1">
                <span>📦</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">New product added</p>
                <p className="text-sm text-text-secondary">iPhone 15 Pro Max - 20 units added</p>
                <p className="text-xs text-text-muted mt-1">2 hours ago</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="p-2 rounded-full bg-success/10 text-success mr-3 mt-1">
                <span>📈</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">Stock updated</p>
                <p className="text-sm text-text-secondary">MacBook Air M2 - 5 units sold</p>
                <p className="text-xs text-text-muted mt-1">5 hours ago</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="p-2 rounded-full bg-warning/10 text-warning mr-3 mt-1">
                <span>⚠️</span>
              </div>
              <div>
                <p className="font-medium text-text-primary">Low stock alert</p>
                <p className="text-sm text-text-secondary">AirPods Pro - Only 3 units left</p>
                <p className="text-xs text-text-muted mt-1">Yesterday</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
