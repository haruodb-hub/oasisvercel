import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, X } from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  description?: string;
  badge?: number;
}

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  items?: MenuItem[];
}

const DEFAULT_ITEMS: MenuItem[] = [
  {
    id: "overview",
    label: "Dashboard",
    icon: "📊",
    description: "Overview & stats",
  },
  {
    id: "customers",
    label: "Customers",
    icon: "👥",
    description: "Manage customers",
    badge: 0,
  },
  {
    id: "products",
    label: "Products",
    icon: "📦",
    description: "Product catalog",
  },
  {
    id: "orders",
    label: "Orders",
    icon: "🛒",
    description: "Order management",
    badge: 0,
  },
  {
    id: "inventory",
    label: "Inventory",
    icon: "📈",
    description: "Stock & analytics",
  },
  {
    id: "content",
    label: "Posts & Content",
    icon: "📝",
    description: "Blog & pages",
  },
];

export default function AdminSidebar({
  activeTab,
  onTabChange,
  items = DEFAULT_ITEMS,
}: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleTabChange = (id: string) => {
    onTabChange(id);
    setIsOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-20 left-4 z-40 lg:hidden p-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-72 z-40 transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static lg:h-auto lg:w-auto lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-full flex flex-col bg-gradient-to-b from-white via-white to-primary/5 border-r border-primary/10 shadow-lg lg:shadow-none">
          {/* Sidebar Header */}
          <div className="pt-20 lg:pt-6 px-6 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-lg">
                🏢
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">Admin</h1>
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            </div>
            <div className="h-px bg-primary/10 mt-4" />
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto px-3 space-y-2">
            {items.map((item) => (
              <SidebarMenuItem
                key={item.id}
                item={item}
                isActive={activeTab === item.id}
                onClick={() => handleTabChange(item.id)}
              />
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-primary/10 p-4 space-y-3">
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 p-4">
              <p className="text-xs font-semibold text-foreground mb-2">
                💡 Pro Tip
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use keyboard shortcut <kbd className="font-mono text-xs bg-black/10 px-1 rounded">H</kbd> to
                toggle this sidebar
              </p>
            </div>
            <button className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-primary border border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-colors">
              🔐 Settings
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar Wrapper */}
      <div className="hidden lg:block lg:w-72 lg:flex-shrink-0" />
    </>
  );
}

function SidebarMenuItem({
  item,
  isActive,
  onClick,
}: {
  item: MenuItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 rounded-xl transition-all duration-300 group",
        "flex items-center gap-3 relative overflow-hidden",
        isActive
          ? "bg-gradient-to-r from-primary via-primary to-primary/80 text-white shadow-lg shadow-primary/20"
          : "text-foreground hover:bg-primary/5 border border-transparent hover:border-primary/20"
      )}
    >
      {/* Background animation for hover */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          isActive ? "opacity-0" : ""
        )}
        style={{
          background:
            "linear-gradient(135deg, rgba(107, 56, 182, 0.05), rgba(244, 208, 63, 0.05))",
        }}
      />

      {/* Icon */}
      <span className="text-2xl flex-shrink-0 relative z-10">{item.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0 relative z-10">
        <div
          className={cn(
            "font-semibold text-sm transition-colors",
            isActive ? "text-white" : "text-foreground"
          )}
        >
          {item.label}
        </div>
        {item.description && (
          <div
            className={cn(
              "text-xs line-clamp-1 transition-colors",
              isActive ? "text-white/80" : "text-muted-foreground"
            )}
          >
            {item.description}
          </div>
        )}
      </div>

      {/* Badge */}
      {item.badge !== undefined && item.badge > 0 && (
        <div
          className={cn(
            "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold relative z-10",
            isActive
              ? "bg-white/20 text-white"
              : "bg-red-500/10 text-red-600 group-hover:bg-red-500/20"
          )}
        >
          {item.badge}
        </div>
      )}

      {/* Active indicator */}
      {isActive && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/40 rounded-l-full" />
      )}
    </button>
  );
}
