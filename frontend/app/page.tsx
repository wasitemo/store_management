import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background flex items-center">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-6">
            <span className="text-3xl">📦</span>
          </div>
          <h1 className="text-5xl font-bold text-text-primary mb-6">
            Welcome to InventoryPro
          </h1>
          <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
            Manage your inventory efficiently with our comprehensive store management system.
            Navigate through the sidebar to access different modules and streamline your operations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              className="flex h-14 items-center justify-center gap-2 rounded-xl bg-primary text-white px-8 transition-colors hover:bg-primary-dark shadow-lg text-lg font-medium"
              href="/dashboard"
            >
              Get Started
            </Link>
            <a
              className="flex h-14 items-center justify-center rounded-xl border border-solid border-border px-8 transition-colors hover:bg-surface-hover text-text-primary text-lg font-medium"
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation
            </a>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Real-time Analytics</h3>
            <p className="text-text-secondary">Track your inventory levels, sales trends, and business performance in real-time.</p>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Secure Access</h3>
            <p className="text-text-secondary">Enterprise-grade security to protect your business data and customer information.</p>
          </div>

          <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Responsive Design</h3>
            <p className="text-text-secondary">Access your inventory management system from any device, anywhere.</p>
          </div>
        </div>

        <div className="mt-16 text-center text-text-secondary">
          <p>© {new Date().getFullYear()} InventoryPro. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
