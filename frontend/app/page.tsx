"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  // optional: loading state biar tidak blank
  return (
    <div className="min-h-screen flex items-center justify-center text-text-secondary">
      Checking session...
    </div>
  );
}
