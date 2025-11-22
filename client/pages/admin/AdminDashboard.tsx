import { useAuth } from "@/store/auth";
import { getOrders, saveOrders, type Order } from "@/lib/orders";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/money";
import { Navigate } from "react-router-dom";
import ProductManager from "@/components/admin/ProductManager";
import PostManager from "@/components/admin/PostManager";
import ContentManager from "@/components/admin/ContentManager";
import CustomerManager from "@/components/admin/CustomerManager";
import InventoryManager from "@/components/admin/InventoryManager";
import SidebarNav from "@/components/admin/SidebarNav";
import AdminSidebarLayout from "@/components/admin/AdminSidebarLayout";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import DashboardHeader from "@/components/admin/DashboardHeader";
import StatCard from "@/components/admin/StatCard";
import OrdersOverview from "@/components/admin/OrdersOverview";

export default function AdminDashboard() {
  const { role } = useAuth();
  const [orders, setOrders] = useState<Order[]>(getOrders());
  const [orderQuery, setOrderQuery] = useState("");
  const [orderStatus, setOrderStatus] = useState<
    "all" | "placed" | "processing" | "shipped" | "delivered" | "cancelled"
  >("all");
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

  if (role !== "admin") return <Navigate to="/login" replace />;

  const update = (idx: number, patch: Partial<Order>) => {
    const next = orders.slice();
    next[idx] = { ...next[idx], ...patch };
    setOrders(next);
    saveOrders(next);
  };

  return (
    <section className="space-y-6">
      <DashboardHeader
        title="Admin Dashboard"
        subtitle="Manage customers, products, orders, inventory, posts and site content."
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

      <AdminSidebarLayout
        overview={
          <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-white to-primary/5 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 p-3">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Welcome to Admin Dashboard
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Manage every aspect of your shop from a single dashboard. Use the sidebar navigation to handle customers, products, inventory, orders, blog posts, and website content. All changes are saved automatically and synced across your store.
                </p>
              </div>
            </div>
          </div>
        }
        customers={
          <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-white to-primary/5 overflow-hidden">
            <CustomerManager />
          </div>
        }
        products={
          <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-white to-primary/5 overflow-hidden">
            <ProductManager />
          </div>
        }
        orders={
          <div className="space-y-6">
            <OrdersOverview
              orders={filteredOrders}
              onUpdate={update}
            />
          </div>
        }
        inventory={
          <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-white to-primary/5 overflow-hidden">
            <InventoryManager />
          </div>
        }
        content={
          <div className="grid gap-6">
            <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-white to-primary/5 overflow-hidden">
              <PostManager />
            </div>
            <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-white to-primary/5 overflow-hidden">
              <ContentManager />
            </div>
          </div>
        }
      />
    </section>
  );
}
