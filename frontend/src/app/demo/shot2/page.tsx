"use client";

import { useState, useEffect } from "react";
import CRTScreenOverlay from "@/components/crt/CRTScreenOverlay";

const GREEN = "#33ff33";
const AMBER = "#ffb000";
const DIM = "#1a8a1a";

interface PipelineStage {
  label: string;
  sublabel: string;
  delay: number; // ms after page load to light up
}

const STAGES: PipelineStage[] = [
  { label: "OURA RING", sublabel: "HR \u2022 HRV \u2022 STRESS \u2022 SLEEP", delay: 800 },
  { label: "GEMINI 2.5", sublabel: "EMOTIONAL PROFILE", delay: 2200 },
  { label: "LYRIA API", sublabel: "ADAPTIVE MUSIC", delay: 3600 },
];

const ARROWS = [
  { label: "biometrics", delay: 1500 },
  { label: "valence \u2022 arousal", delay: 2900 },
];

const BODY_LINES: { text: string; delay: number }[] = [
  { text: "We normalize biometrics against your personal baseline,", delay: 4400 },
  { text: "then map them onto a valence\u2013arousal model.", delay: 5200 },
  { text: "", delay: 5800 },
  { text: "You tell Resonance where you want to go.", delay: 6200 },
  { text: "It computes the delta and generates music", delay: 7000 },
  { text: "designed to bridge that gap.", delay: 7600 },
];

export default function Shot2() {
  const [activeStages, setActiveStages] = useState<boolean[]>([false, false, false]);
  const [activeArrows, setActiveArrows] = useState<boolean[]>([false, false]);
  const [visibleLines, setVisibleLines] = useState(0);

  // Light up stages
  useEffect(() => {
    STAGES.forEach((stage, i) => {
      setTimeout(() => {
        setActiveStages((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, stage.delay);
    });
  }, []);

  // Light up arrows
  useEffect(() => {
    ARROWS.forEach((arrow, i) => {
      setTimeout(() => {
        setActiveArrows((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, arrow.delay);
    });
  }, []);

  // Show body text lines
  useEffect(() => {
    BODY_LINES.forEach((line, i) => {
      setTimeout(() => setVisibleLines((v) => Math.max(v, i + 1)), line.delay);
    });
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        gap: 48,
      }}
    >
      <CRTScreenOverlay />

      {/* Title */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          fontFamily: "var(--font-press-start)",
          fontSize: 12,
          color: AMBER,
          textShadow: `0 0 12px rgba(255,176,0,0.5)`,
          letterSpacing: 4,
        }}
      >
        HOW IT WORKS
      </div>

      {/* Pipeline */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 0,
        }}
      >
        {STAGES.map((stage, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            {/* Stage box */}
            <div
              style={{
                border: `2px solid ${activeStages[i] ? GREEN : DIM}`,
                padding: "20px 28px",
                textAlign: "center",
                transition: "all 0.6s ease",
                boxShadow: activeStages[i]
                  ? `0 0 20px rgba(51,255,51,0.3), inset 0 0 20px rgba(51,255,51,0.05)`
                  : "none",
                minWidth: 180,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-press-start)",
                  fontSize: 11,
                  color: activeStages[i] ? AMBER : "#444",
                  textShadow: activeStages[i] ? `0 0 8px rgba(255,176,0,0.5)` : "none",
                  transition: "all 0.6s ease",
                  marginBottom: 10,
                }}
              >
                {stage.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-vt323)",
                  fontSize: 16,
                  color: activeStages[i] ? GREEN : "#333",
                  textShadow: activeStages[i] ? `0 0 6px rgba(51,255,51,0.4)` : "none",
                  transition: "all 0.6s ease",
                }}
              >
                {stage.sublabel}
              </div>
            </div>

            {/* Arrow between stages */}
            {i < STAGES.length - 1 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "0 12px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-vt323)",
                    fontSize: 14,
                    color: activeArrows[i] ? GREEN : "#222",
                    textShadow: activeArrows[i] ? `0 0 6px rgba(51,255,51,0.4)` : "none",
                    transition: "all 0.5s ease",
                    marginBottom: 4,
                  }}
                >
                  {ARROWS[i].label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-vt323)",
                    fontSize: 28,
                    color: activeArrows[i] ? GREEN : "#222",
                    textShadow: activeArrows[i] ? `0 0 10px rgba(51,255,51,0.6)` : "none",
                    transition: "all 0.5s ease",
                    letterSpacing: -2,
                  }}
                >
                  {">>>"}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Body text */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          maxWidth: 700,
          padding: "0 40px",
        }}
      >
        {BODY_LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: "var(--font-vt323)",
              fontSize: 24,
              color: GREEN,
              textShadow: `0 0 8px rgba(51,255,51,0.3)`,
              lineHeight: 1.5,
              animation: "fadeIn 0.4s ease-out forwards",
            }}
          >
            {line.text || "\u00A0"}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
