"use client";

import CRTScreenOverlay from "./CRTScreenOverlay";

interface CRTMonitorProps {
  children: React.ReactNode;
}

export default function CRTMonitor({ children }: CRTMonitorProps) {
  return (
    <div
      className="relative flex flex-col"
      style={{
        background: "linear-gradient(145deg, #2a2a2a, #1a1a1a, #0d0d0d)",
        borderRadius: 24,
        padding: "20px 20px 0 20px",
        boxShadow:
          "inset 0 2px 4px rgba(255,255,255,0.05), 0 20px 60px rgba(0,0,0,0.8), 0 0 0 2px #111",
      }}
    >
      {/* Bezel */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 16,
          border: "3px solid #111",
          boxShadow:
            "inset 0 0 30px rgba(0,0,0,0.8), inset 0 0 8px rgba(0,0,0,0.5)",
        }}
      >
        {/* Screen */}
        <div
          className="relative overflow-hidden"
          style={{
            background: "#0a0a0a",
            aspectRatio: "4 / 3",
            width: 580,
          }}
        >
          <CRTScreenOverlay />
          <div className="relative z-[1] w-full h-full p-6 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>

      {/* Base / chin */}
      <div className="flex items-center justify-between px-6 py-3">
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            background: "#33ff33",
            boxShadow: "0 0 6px #33ff33, 0 0 12px rgba(51,255,51,0.4)",
          }}
        />
        <span
          className="text-[10px] tracking-[3px]"
          style={{
            fontFamily: "var(--font-press-start)",
            color: "#ffb000",
            textShadow: "0 0 8px rgba(255,176,0,0.4)",
          }}
        >
          RESONANCE
        </span>
        <div className="w-2" />
      </div>
    </div>
  );
}
