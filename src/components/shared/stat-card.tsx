import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trend,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border p-5 transition-all hover:shadow-md", className)}>
      <div className="flex items-center gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/80 shadow-sm backdrop-blur">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
          <p className="text-xs font-medium opacity-80">{label}</p>
          {subtitle && <p className="mt-0.5 text-[10px] opacity-60">{subtitle}</p>}
          {trend && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <span className={cn(trend.positive ? "text-emerald-600" : "text-destructive")}>
                {trend.positive ? "+" : ""}{trend.value}%
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
