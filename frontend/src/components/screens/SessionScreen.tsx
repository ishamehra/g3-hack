"use client";

import { useState } from "react";
import type { MoodState, LyriaParamsRow, SessionState } from "@/types";
import { config } from "@/lib/config";
import {
  textGreen,
  textAmber,
  textDim,
  btnGreen,
  btnAmber,
  separator,
  GREEN,
} from "@/lib/crt-styles";

interface SessionScreenProps {
  targetMood: MoodState | null;
  sessionId: string | null;
  onSessionStart: (id: string) => void;
  onSessionEnd: () => void;
  lyriaParams: LyriaParamsRow | null;
  audioConnected: boolean;
  onChangeMood: () => void;
  onHome: () => void;
}

export default function SessionScreen({
  targetMood,
  sessionId,
  onSessionStart,
  onSessionEnd,
  lyriaParams,
  audioConnected,
  onChangeMood,
  onHome,
}: SessionScreenProps) {
  const [sessionState, setSessionState] = useState<SessionState>("idle");

  const isActive = sessionState === "active";

  const handleStart = async () => {
    setSessionState("connecting");
    try {
      const res = await fetch(`${config.apiUrl}/api/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_mood: targetMood?.label ?? "calm",
          genres: ["ambient", "classical"],
        }),
      });
      const data = await res.json();
      onSessionStart(data.session_id);
      setSessionState("active");
    } catch {
      setSessionState("error");
    }
  };

  const handleStop = async () => {
    try {
      await fetch(`${config.apiUrl}/api/session/stop`, { method: "POST" });
    } catch {
      // ignore stop errors
    }
    onSessionEnd();
    setSessionState("idle");
  };

  const handleChangeMood = async (mood: string) => {
    try {
      await fetch(`${config.apiUrl}/api/mood?mood=${encodeURIComponent(mood)}`, {
        method: "POST",
      });
    } catch {
      // ignore
    }
  };

  const bio = lyriaParams?.biometrics;
  const hr = bio?.hr != null ? String(bio.hr).padStart(3, "0") : "---";
  const hrv = bio?.hrv != null ? String(bio.hrv).padStart(3, "0") : "---";
  const stressPct = bio?.stress_pct != null ? `${Math.round(bio.stress_pct)}%` : "---";

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm mb-3" style={textAmber}>
        NOW PLAYING
      </h2>

      {lyriaParams ? (
        <div className="text-lg space-y-1 mb-3" style={textGreen}>
          <div>MOOD: {lyriaParams.mood_label.toUpperCase()}</div>
          <div>
            INSTRUMENTS: {lyriaParams.instruments.join(", ").toUpperCase()}
          </div>
          <div>
            TEMPO: {lyriaParams.bpm} BPM | SCALE:{" "}
            {lyriaParams.scale.replace(/_/g, " ")}
          </div>
        </div>
      ) : (
        <div className="text-lg mb-3" style={textDim}>
          {sessionState === "connecting" ? "CONNECTING..." : "NO STREAM"}
        </div>
      )}

      <div style={separator} />

      <div className="text-lg space-y-1 mb-3" style={textGreen}>
        <div>
          TARGET:{" "}
          <span style={{ ...textAmber, fontFamily: "var(--font-vt323)" }}>
            {targetMood?.label.toUpperCase() ?? "NONE"}
          </span>
        </div>
        <div>
          STATUS:{" "}
          {sessionState === "active" && audioConnected
            ? "STREAMING..."
            : sessionState === "active"
              ? "WAITING FOR AUDIO..."
              : sessionState === "connecting"
                ? "CONNECTING..."
                : sessionState === "error"
                  ? "ERROR"
                  : "IDLE"}
        </div>
      </div>

      {lyriaParams?.narration && (
        <div
          className="text-xs mb-3 leading-relaxed"
          style={{ ...textDim, fontFamily: "var(--font-vt323)" }}
        >
          {lyriaParams.narration}
        </div>
      )}

      {isActive && audioConnected && (
        <div className="text-lg mb-3" style={textGreen}>
          [
          <span style={{ color: GREEN }}>
            {"█".repeat(8)}
            {"░".repeat(2)}
          </span>
          ] LIVE
        </div>
      )}

      <div style={separator} />

      <div className="text-base space-y-1 mb-3" style={textGreen}>
        <div>
          HR: {hr} | HRV: {hrv} | STRESS: {stressPct}
        </div>
      </div>

      <div className="mt-auto flex gap-3 flex-wrap">
        {sessionState === "idle" || sessionState === "error" ? (
          <button onClick={handleStart} style={btnGreen}>
            {">"} START
          </button>
        ) : null}
        {isActive && (
          <button onClick={handleStop} style={btnGreen}>
            [] STOP
          </button>
        )}
        <button
          onClick={() => {
            if (sessionId) handleChangeMood("calm");
            onChangeMood();
          }}
          style={btnAmber}
        >
          MOOD
        </button>
        <button onClick={onHome} style={{ ...btnGreen, fontSize: 8 }}>
          HOME
        </button>
      </div>
    </div>
  );
}
