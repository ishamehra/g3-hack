/** Shared inline style objects for CRT aesthetic — avoids Tailwind v4 custom class issues */

export const GREEN = "#33ff33";
export const GREEN_DIM = "#1a8a1a";
export const GREEN_GLOW = "rgba(51,255,51,0.4)";
export const AMBER = "#ffb000";
export const AMBER_DIM = "#8a6000";
export const AMBER_GLOW = "rgba(255,176,0,0.4)";

export const textGreen: React.CSSProperties = {
  color: GREEN,
  textShadow: `0 0 6px ${GREEN_GLOW}`,
  fontFamily: "var(--font-vt323)",
};

export const textAmber: React.CSSProperties = {
  color: AMBER,
  textShadow: `0 0 6px ${AMBER_GLOW}`,
  fontFamily: "var(--font-press-start)",
};

export const textDim: React.CSSProperties = {
  color: GREEN_DIM,
  fontFamily: "var(--font-vt323)",
};

export const btnGreen: React.CSSProperties = {
  fontFamily: "var(--font-press-start)",
  fontSize: 10,
  padding: "8px 16px",
  border: `1px solid ${GREEN_DIM}`,
  background: "transparent",
  color: GREEN,
  textShadow: `0 0 6px ${GREEN_GLOW}`,
  cursor: "pointer",
  letterSpacing: 1,
};

export const btnAmber: React.CSSProperties = {
  fontFamily: "var(--font-press-start)",
  fontSize: 10,
  padding: "8px 16px",
  border: `1px solid ${AMBER_DIM}`,
  background: "transparent",
  color: AMBER,
  textShadow: `0 0 6px ${AMBER_GLOW}`,
  cursor: "pointer",
  letterSpacing: 1,
};

export const separator: React.CSSProperties = {
  borderTop: `1px solid ${GREEN_DIM}`,
  margin: "6px 0",
};
