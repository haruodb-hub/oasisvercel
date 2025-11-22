import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import SidebarNav from "@/components/admin/SidebarNav";

export default function AdminSidebarLayout({
  overview,
  customers,
  products,
  orders,
  inventory,
  content,
}: {
  overview: React.ReactNode;
  customers: React.ReactNode;
  products: React.ReactNode;
  orders: React.ReactNode;
  inventory: React.ReactNode;
  content: React.ReactNode;
}) {
  const [tab, setTab] = useState<string>("overview");
  
  const navOptions = [
    { value: "overview", label: "📊 Overview" },
    { value: "customers", label: "👥 Customers" },
    { value: "products", label: "📦 Products" },
    { value: "orders", label: "🛒 Orders" },
    { value: "inventory", label: "📈 Inventory" },
    { value: "content", label: "📝 Posts & Content" },
  ];

  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      orientation="vertical"
      className="grid gap-6 md:gap-8 lg:grid-cols-5"
    >
      <aside className="lg:col-span-1">
        {/* Mobile Navigation */}
        <div className="block lg:hidden mb-6">
          <div className="relative">
            <select
              className="w-full h-12 rounded-xl border border-primary/20 bg-white px-4 py-2 text-sm font-semibold text-foreground transition-all appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent hover:border-primary/40"
              value={tab}
              onChange={(e) => setTab(e.target.value)}
            >
              {navOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-foreground">
              ▼
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:block">
          <SidebarNav />
        </div>
      </aside>

      {/* Content Section */}
      <section className="lg:col-span-4 space-y-6 md:space-y-8">
        <TabsContent value="overview" className="m-0">
          {overview}
        </TabsContent>
        <TabsContent value="customers" className="m-0">
          {customers}
        </TabsContent>
        <TabsContent value="products" className="m-0">
          {products}
        </TabsContent>
        <TabsContent value="orders" className="m-0">
          {orders}
        </TabsContent>
        <TabsContent value="inventory" className="m-0">
          {inventory}
        </TabsContent>
        <TabsContent value="content" className="m-0">
          {content}
        </TabsContent>
      </section>
    </Tabs>
  );
}
