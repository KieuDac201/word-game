import type { ReactNode } from "react";
import { StatTile } from "@/components/ui/stat-tile";
import type { AccentToken } from "@/lib/theme";

export interface StatItem {
  label: string;
  value: ReactNode;
  accent?: AccentToken;
  className?: string;
}

export function StatsGrid({
  stats,
  className = "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3",
}: {
  stats: StatItem[];
  className?: string;
}) {
  return (
    <div className={`w-full ${className}`}>
      {stats.map((stat) => (
        <StatTile
          key={stat.label}
          label={stat.label}
          value={stat.value}
          accent={stat.accent}
          className={stat.className}
        />
      ))}
    </div>
  );
}
