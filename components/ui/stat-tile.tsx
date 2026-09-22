import type { ReactNode } from "react";
import { GlassCard } from "./glass-card";
import { accentColor, type AccentToken } from "@/lib/theme";

export function StatTile({
  label,
  value,
  accent = "neutral",
  className = "",
}: {
  label: string;
  value: ReactNode;
  accent?: AccentToken;
  className?: string;
}) {
  return (
    <GlassCard className={`p-3.5 text-center ${className}`.trim()}>
      <div className="text-[0.65rem] text-white/40 uppercase tracking-wider font-[family-name:var(--font-mono)] mb-1">
        {label}
      </div>
      <div
        className="text-xl font-bold font-[family-name:var(--font-mono)]"
        style={{ color: accentColor(accent) }}
      >
        {value}
      </div>
    </GlassCard>
  );
}
