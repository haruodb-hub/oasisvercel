import { useAuth } from "@/store/auth";
import { getOrders, saveOrders, type Order } from "@/lib/orders";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { formatCurrency } from "@/lib/money";
import { Navigate } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardHeader from "@/components/admin/DashboardHeader";
import StatCard from "@/components/admin/StatCard";

// Lazy load heavy components
const ProductManager = lazy(() => import("@/components/admin/ProductManager"));
const PostManager = lazy(() => import("@/components/admin/PostManager"));
const ContentManager = lazy(() => import("@/components/admin/ContentManager"));
const CustomerManager = lazy(() => import("@/components/admin/CustomerManager"));
const InventoryManager = lazy(() => import("@/components/admin/InventoryManager"));
const OrdersOverview = lazy(() => import("@/components/admin/OrdersOverview"));

export default function AdminDashboard() {
  const auth = useAuth();
  const [orders, setOrders] = useState<Order[]>(getOrders());
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatus, setOrderStatus] = useState<
    "all" | "placed" | "processing" | "shipped" | "delivered" | "cancelled"
  >("all");
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Listen for storage changes (real-time updates when orders change)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "orders") {
        setOrders(getOrders());
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const stats = useMemo(() => {
    const total = orders.reduce((s, o) => s + o.totals.total, 0);
    const pendingVerify = orders.filter((o) => !o.paymentVerified).length;
    const placed = orders.length;
    return { total, pendingVerify, placed };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = orderQuery.toLowerCase();
    return orders.filter((o) => {
      if (orderStatus !== "all" && o.status !== orderStatus) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.items.some((i) => i.product.title.toLowerCase().includes(q)) ||
        o.payment.method.toLowerCase().includes(q)
      );
    });
  }, [orders, orderQuery, orderStatus]);

  // Set admin role for demo/development (only once)
  useEffect(() => {
    if (auth.role !== "admin") {
      auth.signIn("admin", { name: "Admin User", email: "admin@oasis.local" });
    }
  }, []);

  // Allow access for demo
  // if (auth.role !== "admin") return <Navigate to="/login" replace />;

  const update = (idx: number, patch: Partial<Order>) => {
    const next = orders.slice();
    next[idx] = { ...next[idx], ...patch };
    setOrders(next);
    saveOrders(next);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-white to-primary/5">
      {/* Fixed Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Page Header */}
          <div className="mb-8">
            <DashboardHeader
              title="Admin Dashboard"
              subtitle="Manage your entire business from one place"
            />
          </div>

          {/* Overview Tab - Stats and Welcome Card */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-max">
                <StatCard
                  title="💰 Total Revenue"
                  value={formatCurrency(stats.total)}
                  icon={
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                  bgColor="bg-gradient-to-br from-primary/20 to-primary/10"
                  iconColor="text-primary"
                  trend={{
                    value: 12,
                    isPositive: true,
                  }}
                />

                <StatCard
                  title="📦 Total Orders"
                  value={stats.placed}
                  icon={
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  }
                  bgColor="bg-gradient-to-br from-blue-100 to-blue-50"
                  iconColor="text-blue-600"
                />

                <StatCard
                  title="⚠️ Pending Verification"
                  value={stats.pendingVerify}
                  icon={
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  }
                  bgColor="bg-gradient-to-br from-amber-100 to-amber-50"
                  iconColor="text-amber-600"
                  trend={{
                    value: 8,
                    isPositive: false,
                  }}
                />
              </div>

              {/* Welcome Card */}
              <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-white via-white to-primary/5 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="flex-shrink-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-4 text-3xl">
                    👋
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      Welcome Back!
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                      You have access to all admin tools. Use the sidebar menu to navigate between different sections. Each section lets you manage specific aspects of your business efficiently.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: "👥", label: "Customers", count: "45" },
                  { icon: "📦", label: "Products", count: "128" },
                  { icon: "🛒", label: "Orders", count: stats.placed },
                  { icon: "📈", label: "Revenue", count: formatCurrency(stats.total) },
                ].map((action, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-primary/10 bg-white p-5 text-center hover:border-primary/20 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="text-3xl mb-2">{action.icon}</div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      {action.label}
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {action.count}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === "customers" && (
            <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading Customers...</div>}>
              <div className="rounded-2xl border border-primary/10 bg-white overflow-hidden shadow-sm">
                <CustomerManager />
              </div>
            </Suspense>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading Products...</div>}>
              <div className="rounded-2xl border border-primary/10 bg-white overflow-hidden shadow-sm">
                <ProductManager />
              </div>
            </Suspense>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading Orders...</div>}>
              <div className="space-y-6">
                <OrdersOverview orders={filteredOrders} onUpdate={update} />
              </div>
            </Suspense>
          )}

          {/* Inventory Tab */}
          {activeTab === "inventory" && (
            <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading Inventory...</div>}>
              <div className="rounded-2xl border border-primary/10 bg-white overflow-hidden shadow-sm">
                <InventoryManager />
              </div>
            </Suspense>
          )}

          {/* Content Tab */}
          {activeTab === "content" && (
            <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading Content...</div>}>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-primary/10 bg-white overflow-hidden shadow-sm">
                  <PostManager />
                </div>
                <div className="rounded-2xl border border-primary/10 bg-white overflow-hidden shadow-sm">
                  <ContentManager />
                </div>
              </div>
            </Suspense>
          )}
        </div>
      </main>
    </div>
  );
}
