import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  bgColor: string;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({
  title,
  value,
  icon,
  bgColor,
  iconColor,
  trend,
}: StatCardProps) {
  return (
    <div className="group relative rounded-2xl border border-primary/10 bg-gradient-to-br from-white to-primary/5 p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1">
      <div className="absolute inset-0 rounded-2xl opacity-0 blur transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, rgba(265, 60%, 40%, 0.1), rgba(43, 85%, 55%, 0.1))`,
        }}
      />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {title}
          </p>
          <h3 className="text-3xl md:text-4xl font-bold text-foreground">
            {value}
          </h3>
          {trend && (
            <div className="mt-3 flex items-center gap-1">
              <span
                className={`text-xs font-semibold ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>

        <div
          className={`flex items-center justify-center rounded-xl p-3 transition-transform group-hover:scale-110 ${bgColor}`}
        >
          <div className={iconColor}>{icon}</div>
        </div>
      </div>

      {/* Decorative corner accent */}
      <div className="absolute -bottom-1 -right-1 h-24 w-24 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-20"
        style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
      />
    </div>
  );
}
