"use client";

import { useState, useEffect } from "react";
import CRTScreenOverlay from "@/components/crt/CRTScreenOverlay";

const GREEN = "#33ff33";
const AMBER = "#ffb000";
const DIM = "#1a8a1a";

const LINES: { text: string; style: "title" | "tagline" | "tech" | "dim"; delay: number }[] = [
  { text: "RESONANCE", style: "title", delay: 800 },
  { text: "", style: "dim", delay: 400 },
  { text: "Biometric music that doesn't just", style: "tagline", delay: 1200 },
  { text: "reflect how you feel \u2014", style: "tagline", delay: 800 },
  { text: "it moves you where you want to go.", style: "tagline", delay: 800 },
  { text: "", style: "dim", delay: 600 },
  { text: "Adaptive music for focus, relaxation, or recovery", style: "dim", delay: 1000 },
  { text: "driven by your own biology.", style: "dim", delay: 800 },
  { text: "", style: "dim", delay: 600 },
  { text: "BUILT WITH GEMINI 2.5 FLASH + LYRIA REALTIME API", style: "tech", delay: 1200 },
];

export default function Shot4() {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible >= LINES.length) return;
    const timer = setTimeout(() => setVisible((v) => v + 1), LINES[visible].delay);
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
          const isTech = line.style === "tech";
          const isDim = line.style === "dim";
          const isTagline = line.style === "tagline";

          return (
            <div
              key={i}
              style={{
                fontFamily: isTitle || isTech ? "var(--font-press-start)" : "var(--font-vt323)",
                fontSize: isTitle ? 52 : isTech ? 10 : isDim ? 20 : 28,
                color: isTitle ? AMBER : isTech ? AMBER : isDim ? DIM : GREEN,
                textShadow: isTitle
                  ? `0 0 30px rgba(255,176,0,0.6)`
                  : isTech
                    ? `0 0 10px rgba(255,176,0,0.4)`
                    : isTagline
                      ? `0 0 12px rgba(51,255,51,0.5)`
                      : "none",
                marginBottom: isTitle ? 16 : 4,
                letterSpacing: isTitle ? 12 : isTech ? 3 : 2,
                lineHeight: 1.5,
                animation: "fadeSlideIn 0.5s ease-out forwards",
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
