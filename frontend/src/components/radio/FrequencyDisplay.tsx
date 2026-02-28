"use client";

import type { AppScreen } from "@/types";
import type { TrackInfo } from "@/lib/lyria/LyriaAudioPlayer";

interface FrequencyDisplayProps {
  appScreen: AppScreen;
  currentTrack: TrackInfo | null;
  playerState: string;
}

export default function FrequencyDisplay({
  appScreen,
  currentTrack,
  playerState,
}: FrequencyDisplayProps) {
  let text = "-- STANDBY --";

  if (appScreen === "biometric") {
    text = "CONNECTING...";
  } else if (appScreen === "mood") {
    text = "SELECT TARGET";
  } else if (appScreen === "session") {
    if (playerState === "playing" && currentTrack) {
      const p = currentTrack.params;
      text = `TRK ${String(currentTrack.track_number).padStart(2, "0")} | ${p.tempo_bpm} BPM`;
    } else if (playerState === "loading") {
      text = "LOADING...";
    } else if (playerState === "crossfading") {
      text = "CROSSFADING...";
    } else {
      text = "READY";
    }
  }

  return (
    <div
      className="w-full text-center text-sm tracking-[2px]"
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
