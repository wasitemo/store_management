"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body = { username: username, password: password };
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const text = await res.clone().text();
      console.log("RESPONSE:", text);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("access_token", data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="mx-auto flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl text-primary">🔒</span>
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-text-primary">
            Welcome Back
          </h1>
          <p className="mt-2 text-text-secondary">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-surface rounded-2xl shadow-xl p-8 border border-border"
        >
          {error && (
            <div className="mb-6 rounded-lg bg-danger/10 text-danger px-4 py-3 text-sm border border-danger flex items-start">
              <span className="mr-2 text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full rounded-lg border border-border px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary bg-surface transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
                👤
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                className="w-full rounded-lg border border-border px-4 py-3 pl-11 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary bg-surface transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">
                🔐
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary text-white py-3.5 font-medium hover:bg-primary-dark transition disabled:opacity-50 shadow-md flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-text-secondary">
          © {new Date().getFullYear()} InventoryPro. All rights reserved.
        </p>
      </div>
    </div>
  );
}
