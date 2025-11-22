import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/money";
import type { Order } from "@/lib/orders";
import { Button } from "@/components/ui/button";

interface OrdersOverviewProps {
  orders: Order[];
  onUpdate: (idx: number, patch: Partial<Order>) => void;
}

const statusConfig: Record<string, { bgColor: string; textColor: string; icon: string }> = {
  placed: { bgColor: "bg-blue-100", textColor: "text-blue-700", icon: "📦" },
  processing: { bgColor: "bg-amber-100", textColor: "text-amber-700", icon: "⚙️" },
  shipped: { bgColor: "bg-purple-100", textColor: "text-purple-700", icon: "🚚" },
  delivered: { bgColor: "bg-green-100", textColor: "text-green-700", icon: "✓" },
  cancelled: { bgColor: "bg-red-100", textColor: "text-red-700", icon: "✕" },
};

export default function OrdersOverview({ orders, onUpdate }: OrdersOverviewProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "placed" | "processing" | "shipped" | "delivered" | "cancelled">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filteredOrders = useMemo(() => {
    const q = query.toLowerCase();
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.items.some((i) => i.product.title.toLowerCase().includes(q)) ||
        o.payment.method.toLowerCase().includes(q)
      );
    });
  }, [orders, query, status]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 lg:grid-cols-4">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by order ID, product..."
          className="col-span-1 sm:col-span-2 lg:col-span-2 h-11 rounded-lg border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as any);
            setCurrentPage(1);
          }}
          className="h-11 rounded-lg border border-primary/20 px-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="placed">Placed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          className="h-11 rounded-lg border border-primary/20 px-4 text-sm font-medium transition-all hover:bg-primary/10 hover:border-primary/40"
          onClick={() => alert(JSON.stringify(filteredOrders, null, 2))}
        >
          📊 Export
        </button>
      </div>

      {/* Orders Grid - Responsive Cards */}
      {paginatedOrders.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-1">
          {paginatedOrders.map((o, idx) => {
            const actualIdx = orders.indexOf(o);
            const config = statusConfig[o.status];

            return (
              <div
                key={o.id}
                className="group relative rounded-xl border border-primary/10 bg-gradient-to-br from-white to-primary/5 p-5 transition-all duration-300 hover:shadow-md hover:border-primary/20"
              >
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 pb-4 border-b border-primary/10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-foreground truncate">
                        {o.id}
                      </span>
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${config.bgColor} ${config.textColor} border-0 whitespace-nowrap`}>
                        {config.icon} {o.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(o.totals.total)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {o.payment.method.toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Items Section */}
                <div className="mb-4 pb-4 border-b border-primary/10">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 tracking-wide">
                    Items
                  </p>
                  <div className="space-y-2">
                    {o.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-start justify-between text-sm">
                        <span className="flex-1 text-foreground font-medium truncate">
                          {item.product.title}
                        </span>
                        <span className="text-muted-foreground text-xs ml-2">
                          ×{item.qty}
                        </span>
                      </div>
                    ))}
                    {o.items.length > 3 && (
                      <p className="text-xs text-primary font-medium">
                        +{o.items.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Verification */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                    <input
                      type="checkbox"
                      checked={o.paymentVerified}
                      onChange={(e) =>
                        onUpdate(actualIdx, { paymentVerified: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-primary/30 cursor-pointer"
                    />
                    <label className="text-xs font-medium text-foreground cursor-pointer flex-1">
                      Payment Verified
                    </label>
                  </div>

                  {/* Status Select */}
                  <select
                    className="h-9 rounded-lg border border-primary/20 px-3 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent"
                    value={o.status}
                    onChange={(e) =>
                      onUpdate(actualIdx, { status: e.target.value as any })
                    }
                  >
                    <option value="placed">Placed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {/* View Button */}
                  <button
                    className="h-9 rounded-lg border border-primary/20 px-3 text-xs font-medium transition-all hover:bg-primary/10 hover:border-primary/40 text-primary"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(JSON.stringify(o, null, 2));
                    }}
                  >
                    👁️ View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-primary/10 bg-gradient-to-br from-white to-primary/5 p-12 text-center">
          <p className="text-muted-foreground text-sm">
            📭 No orders found. Try adjusting your filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min(currentPage * pageSize, filteredOrders.length)} of{" "}
            {filteredOrders.length} orders
          </p>
          <div className="flex gap-2">
            <button
              className="h-9 px-4 rounded-lg border border-primary/20 text-sm font-medium transition-all hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            >
              ← Previous
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i + 1}
                  className={`h-9 w-9 rounded-lg font-medium text-sm transition-all ${
                    currentPage === i + 1
                      ? "bg-primary text-primary-foreground border border-primary"
                      : "border border-primary/20 text-foreground hover:bg-primary/10"
                  }`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              className="h-9 px-4 rounded-lg border border-primary/20 text-sm font-medium transition-all hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
