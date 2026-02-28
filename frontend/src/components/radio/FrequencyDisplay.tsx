"use client";

import type { AppScreen, LyriaParamsRow } from "@/types";

interface FrequencyDisplayProps {
  appScreen: AppScreen;
  lyriaParams: LyriaParamsRow | null;
  audioConnected: boolean;
}

export default function FrequencyDisplay({
  appScreen,
  lyriaParams,
  audioConnected,
}: FrequencyDisplayProps) {
  let text = "-- STANDBY --";

  if (appScreen === "biometric") {
    text = "CONNECTING...";
  } else if (appScreen === "mood") {
    text = "SELECT TARGET";
  } else if (appScreen === "session") {
    if (audioConnected && lyriaParams) {
      text = `${lyriaParams.bpm} BPM | ${lyriaParams.mood_label.toUpperCase()}`;
    } else if (audioConnected) {
      text = "STREAMING...";
    } else {
      text = "READY";
    }
  }

  return (
    <div
      className="flex-1 md:flex-none w-full text-center text-sm tracking-[2px]"
      style={{
        padding: "8px 12px",
        fontFamily: "var(--font-vt323)",
        background: "#0a1a0a",
        color: "#33ff33",
        border: "1px solid #1a3a1a",
        borderRadius: 4,
        boxShadow:
          "inset 0 0 10px rgba(51,255,51,0.1), 0 0 4px rgba(51,255,51,0.05)",
        textShadow: "0 0 8px rgba(51,255,51,0.4)",
      }}
    >
      {text}
    </div>
  );
}
