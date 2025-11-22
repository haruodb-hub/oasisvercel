import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NavItem {
  value: string;
  label: string;
  icon: string;
  description?: string;
  badge?: number;
}

export default function SidebarNav() {
  const items: NavItem[] = [
    {
      value: "overview",
      label: "Overview",
      icon: "📊",
      description: "Dashboard stats",
    },
    {
      value: "customers",
      label: "Customers",
      icon: "👥",
      description: "Manage customers",
      badge: 0,
    },
    {
      value: "products",
      label: "Products",
      icon: "📦",
      description: "Edit inventory",
    },
    {
      value: "orders",
      label: "Orders",
      icon: "🛒",
      description: "View & manage",
      badge: 0,
    },
    {
      value: "inventory",
      label: "Inventory",
      icon: "📈",
      description: "Stock levels",
    },
    {
      value: "content",
      label: "Posts & Content",
      icon: "📝",
      description: "Blog & pages",
    },
  ];

  return (
    <nav aria-label="Admin sections" className="sticky top-16">
      <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-white to-primary/5 p-1">
        <div className="mb-4 mt-3 text-xs font-bold text-foreground uppercase tracking-widest px-4">
          📋 Menu
        </div>
        <TabsList className="flex flex-col w-full gap-2 rounded-xl border-0 bg-transparent p-3">
          {items.map((item) => (
            <NavCard key={item.value} item={item} />
          ))}
        </TabsList>
      </div>
    </nav>
  );
}

function NavCard({ item }: { item: NavItem }) {
  return (
    <TabsTrigger
      value={item.value}
      className="group relative w-full justify-start px-4 py-3 rounded-xl border border-transparent bg-white transition-all duration-300 text-left font-medium text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:border-primary data-[state=active]:shadow-lg hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-center gap-3 w-full">
        <span className="text-xl flex-shrink-0">{item.icon}</span>
        <div className="flex-1 min-w-0 text-left">
          <div className="font-semibold text-foreground group-data-[state=active]:text-white transition-colors">
            {item.label}
          </div>
          {item.description && (
            <div className="text-xs text-muted-foreground group-data-[state=active]:text-white/75 mt-0.5 line-clamp-1 transition-colors">
              {item.description}
            </div>
          )}
        </div>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="ml-2 inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white group-data-[state=active]:bg-white group-data-[state=active]:text-primary transition-colors">
            {item.badge}
          </span>
        )}
      </div>
    </TabsTrigger>
  );
}

