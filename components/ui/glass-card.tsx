import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

export function GlassCard({
  active = false,
  className = "",
  ...props
}: GlassCardProps) {
  return (
    <div
      className={`glass-card ${active ? "glass-card-active" : ""} ${className}`.trim()}
      {...props}
    />
  );
}
