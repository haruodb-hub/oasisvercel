export default function DashboardHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-6 md:p-8 lg:p-10">
      <div className="relative z-10">
        <h1 className="font-['Playfair Display'] text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-3xl text-sm md:text-base text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        ) : null}
        {actions ? (
          <div className="mt-5 flex flex-wrap gap-3">{actions}</div>
        ) : null}
      </div>

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

      {/* Grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(265,60%,40%,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(265,60%,40%,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
    </div>
  );
}
