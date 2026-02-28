"use client";

import { useState, useEffect } from "react";
import CRTScreenOverlay from "@/components/crt/CRTScreenOverlay";

const GREEN = "#33ff33";
const AMBER = "#ffb000";

const LINES: { text: string; style: "amber" | "green" | "title" | "dim"; delay: number }[] = [
  { text: "YOUR HEART RATE IS DATA.", style: "amber", delay: 600 },
  { text: "YOUR STRESS LEVEL IS DATA.", style: "amber", delay: 1200 },
  { text: "", style: "dim", delay: 200 },
  { text: "WHAT IF YOU COULD HACK YOUR OWN BIOLOGY", style: "green", delay: 1400 },
  { text: "WITH MUSIC GENERATED JUST FOR YOU?", style: "green", delay: 1200 },
  { text: "", style: "dim", delay: 400 },
  { text: "RESONANCE", style: "title", delay: 1000 },
  { text: "Adaptive music powered by your biometrics", style: "dim", delay: 800 },
];

export default function Shot1() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= LINES.length) return;

    // Cumulative delay from all previous lines
    const nextDelay = LINES[visible].delay;
    const timer = setTimeout(() => setVisible((v) => v + 1), nextDelay);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <CRTScreenOverlay />
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 40px" }}>
        {LINES.slice(0, visible).map((line, i) => {
          const isTitle = line.style === "title";
          const isAmber = line.style === "amber" || isTitle;
          const isDim = line.style === "dim";
          const color = isDim ? "#1a8a1a" : isAmber ? AMBER : GREEN;
          const glow = isAmber ? "rgba(255,176,0,0.6)" : "rgba(51,255,51,0.6)";

          return (
            <div
              key={i}
              style={{
                fontFamily: isTitle ? "var(--font-press-start)" : "var(--font-vt323)",
                fontSize: isTitle ? 56 : isDim ? 22 : 30,
                color,
                textShadow: isDim ? "none" : `0 0 20px ${glow}`,
                marginBottom: isTitle ? 28 : 6,
                letterSpacing: isTitle ? 10 : 3,
                lineHeight: 1.4,
                animation: "fadeSlideIn 0.4s ease-out forwards",
              }}
            >
              {line.text || "\u00A0"}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
