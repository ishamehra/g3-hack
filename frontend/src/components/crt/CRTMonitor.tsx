"use client";

import CRTScreenOverlay from "./CRTScreenOverlay";

interface ToggleSwitch {
  label: string;
  on: boolean;
  onToggle: () => void;
}

interface CRTMonitorProps {
  children: React.ReactNode;
  toggles?: ToggleSwitch[];
}

export default function CRTMonitor({ children, toggles }: CRTMonitorProps) {
  return (
    <div
      className="relative flex flex-col w-full md:w-auto"
      style={{
        background: "linear-gradient(145deg, #2a2a2a, #1a1a1a, #0d0d0d)",
        borderRadius: 24,
        boxShadow:
          "inset 0 2px 4px rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.8), 0 0 0 2px #111",
      }}
    >
      {/* Bezel */}
      <div
        className="relative overflow-hidden m-2 md:m-5 mb-0 md:mb-0"
        style={{
          borderRadius: 16,
          border: "3px solid #111",
          boxShadow:
            "inset 0 0 30px rgba(0,0,0,0.8), inset 0 0 8px rgba(0,0,0,0.5)",
        }}
      >
        {/* Screen */}
        <div
          className="relative overflow-hidden w-full md:w-[580px] aspect-[4/5] md:aspect-[4/3]"
          style={{ background: "#0a0a0a" }}
        >
          <CRTScreenOverlay />
          <div className="relative z-[1] w-full h-full p-4 md:p-6 overflow-hidden md:overflow-y-auto">
            {children}
          </div>
        </div>
      </div>

      {/* Base / chin */}
      <div className="flex items-center justify-center gap-4 md:gap-6 px-4 md:px-6 py-2 md:py-3">
        {/* Power LED */}
        <div
          className="w-2 h-2 rounded-full animate-pulse shrink-0"
          style={{
            background: "#33ff33",
            boxShadow: "0 0 6px #33ff33, 0 0 12px rgba(51,255,51,0.4)",
          }}
        />

        {/* Toggle switches — left side */}
        {toggles?.map(({ label, on, onToggle }) => (
          <button
            key={label}
            onClick={onToggle}
            className="flex items-center gap-[6px] shrink-0"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <span
              style={{
                fontFamily: "var(--font-press-start)",
                fontSize: 8,
                color: on ? "#ffb000" : "#444",
                textShadow: on ? "0 0 6px rgba(255,176,0,0.4)" : "none",
                transition: "color 0.2s",
              }}
            >
              {label}
            </span>
            <div
              style={{
                width: 30,
                height: 16,
                borderRadius: 4,
                background: "linear-gradient(180deg, #1a1a1a, #111)",
                border: "1px solid #333",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.6)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: on ? 14 : 2,
                  width: 12,
                  height: 10,
                  borderRadius: 3,
                  background: on
                    ? "linear-gradient(180deg, #c0a060, #8a6a30)"
                    : "linear-gradient(180deg, #555, #333)",
                  border: `1px solid ${on ? "#9a7a40" : "#444"}`,
                  boxShadow: on
                    ? "0 0 4px rgba(255,176,0,0.2), inset 0 1px 1px rgba(255,255,255,0.2)"
                    : "inset 0 1px 1px rgba(255,255,255,0.1)",
                  transition: "left 0.12s ease, background 0.2s",
                }}
              />
            </div>
          </button>
        ))}

        {/* RESONANCE — centered */}
        <span
          className="tracking-[3px]"
          style={{
            fontFamily: "var(--font-press-start)",
            fontSize: 8,
            color: "#ffb000",
            textShadow: "0 0 8px rgba(255,176,0,0.4)",
          }}
        >
          RESONANCE
        </span>
      </div>
    </div>
  );
}
