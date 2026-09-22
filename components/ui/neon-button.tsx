import type { ButtonHTMLAttributes } from "react";

export function NeonButton({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`neon-button cursor-pointer ${className}`.trim()}
      {...props}
    >
      <span>{children}</span>
    </button>
  );
}
