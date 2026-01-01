export default function DiscountPage() {
  return (
    <div className="p-container-padding">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Discounts Management</h1>
        <p className="text-text-secondary mt-2">Manage all discount promotions and offers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary mr-4">
              <span className="text-xl">🏷️</span>
            </div>
            <h2 className="text-xl font-semibold text-text-primary">Product Discounts</h2>
          </div>
          <p className="text-text-secondary mb-4">Manage discounts for specific products</p>
          <a
            href="/stuff-discount"
            className="inline-block bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
          >
            Manage Product Discounts
          </a>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-success/10 text-success mr-4">
              <span className="text-xl">🎁</span>
            </div>
            <h2 className="text-xl font-semibold text-text-primary">Order Discounts</h2>
          </div>
          <p className="text-text-secondary mb-4">Manage discounts for entire orders</p>
          <a
            href="/order-discount"
            className="inline-block bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
          >
            Manage Order Discounts
          </a>
        </div>
      </div>
    </div>
  );
}
