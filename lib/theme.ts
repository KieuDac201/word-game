/** Accent tokens mirroring the CSS custom properties declared in app/globals.css. */
export const ACCENTS = {
  cyan: { css: "var(--neon-cyan)", rgb: "0, 240, 255" },
  pink: { css: "var(--neon-pink)", rgb: "255, 45, 149" },
  green: { css: "var(--neon-green)", rgb: "0, 255, 136" },
  yellow: { css: "var(--neon-yellow)", rgb: "255, 225, 77" },
  purple: { css: "var(--neon-purple)", rgb: "180, 77, 255" },
  red: { css: "var(--neon-red)", rgb: "255, 77, 77" },
  neutral: { css: "rgba(255, 255, 255, 0.85)", rgb: "255, 255, 255" },
} as const;

export type AccentToken = keyof typeof ACCENTS;

export function accentColor(token: AccentToken): string {
  return ACCENTS[token].css;
}

export function accentAlpha(token: AccentToken, alpha: number): string {
  return `rgba(${ACCENTS[token].rgb}, ${alpha})`;
}

export function accentGlow(
  token: AccentToken,
  alpha = 0.2,
  spread = 20,
): string {
  return `0 0 ${spread}px ${accentAlpha(token, alpha)}`;
}
