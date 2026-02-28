"use client";

import { useEffect, useRef, useState } from "react";
import type { MoodState, LyriaParamsRow, SessionState } from "@/types";
import { config } from "@/lib/config";
import { useTypewriter } from "@/hooks/useTypewriter";
import {
  textGreen,
  textAmber,
  textDim,
  btnGreen,
  btnAmber,
  separator,
  GREEN,
} from "@/lib/crt-styles";

const ASCII_NUMS: Record<number, string[]> = {
  3: [" ██████╗ ", "╚════██║", " █████╔╝", "╚════██║", " ██████╔╝", " ╚═════╝ "],
  2: [" ██████╗ ", "╚════██║", " █████╔╝", "██╔═══╝ ", "███████╗", "╚══════╝"],
  1: [" ██╗", "███║", "╚██║", " ██║", " ██║", " ╚═╝"],
};

function BpmSparkline({ history }: { history: number[] }) {
  if (history.length < 2) return null;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const w = 60;
  const h = 24;
  const points = history
    .map((v, i) => {
      const x = (i / (history.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline
        points={points}
        fill="none"
        stroke={GREEN}
        strokeWidth={1.5}
        style={{ filter: `drop-shadow(0 0 3px ${GREEN})` }}
      />
    </svg>
  );
}

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
  const [sessionState, setSessionState] = useState<SessionState>(
    sessionId ? "active" : "idle"
  );
  const [glowStatus, setGlowStatus] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const prevState = useRef<SessionState>(sessionState);

  const isActive = sessionState === "active";
  const didAutoStart = useRef(false);
  const [countdown, setCountdown] = useState(3);
  const [bpmHistory, setBpmHistory] = useState<number[]>([]);

  // Detect state transitions for micro-animations
  useEffect(() => {
    const prev = prevState.current;
    prevState.current = sessionState;
    if (prev === "connecting" && sessionState === "active") {
      setGlowStatus(true);
      const t = setTimeout(() => setGlowStatus(false), 500);
      return () => clearTimeout(t);
    }
  }, [sessionState]);

  // Auto-start session on mount if not already active
  useEffect(() => {
    if (!sessionId && !didAutoStart.current) {
      didAutoStart.current = true;
      handleStart();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown 3 → 2 → 1 → done
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 700);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Track music BPM history for sparkline
  const prevBpm = useRef<number | null>(null);
  useEffect(() => {
    const bpm = lyriaParams?.bpm;
    if (bpm != null && bpm !== prevBpm.current) {
      prevBpm.current = bpm;
      setBpmHistory((h) => [...h.slice(-19), bpm]);
    }
  }, [lyriaParams?.bpm]);

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
    setFadingOut(true);
    try {
      await fetch(`${config.apiUrl}/api/session/stop`, { method: "POST" });
    } catch {
      // ignore stop errors
    }
    setTimeout(() => {
      onSessionEnd();
      setSessionState("idle");
      setFadingOut(false);
    }, 300);
  };

  const bio = lyriaParams?.biometrics;
  const hr = bio?.hr != null ? String(bio.hr).padStart(3, "0") : "---";
  const hrv = bio?.hrv != null ? String(bio.hrv).padStart(3, "0") : "---";
  const stressPct =
    bio?.stress_pct != null ? `${Math.round(bio.stress_pct)}%` : "---";
  const sleep =
    bio?.sleep_score != null ? String(Math.round(bio.sleep_score)) : "---";
  const ready =
    bio?.readiness_score != null
      ? String(Math.round(bio.readiness_score))
      : "---";

  const currentBpm = lyriaParams?.bpm;

  // Typewriter narration
  const { displayText, isTyping } = useTypewriter(lyriaParams?.narration);

  // Status text with micro-animation classes
  const statusText =
    sessionState === "active" && audioConnected
      ? "STREAMING..."
      : sessionState === "active"
        ? "WAITING FOR AUDIO..."
        : sessionState === "connecting"
          ? "CONNECTING..."
          : sessionState === "error"
            ? "ERROR"
            : "IDLE";

  const statusClass =
    sessionState === "connecting"
      ? "status-pulsing"
      : glowStatus
        ? "glow-once"
        : "";

  return (
    <div
      className={`flex flex-col h-full ${fadingOut ? "session-fade-out" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-sm" style={textAmber}>
          NOW PLAYING
        </h2>

        {/* Top-right: countdown then BPM sparkline */}
        <div className="flex items-center gap-2">
          {countdown > 0 ? (
            <pre
              style={{
                fontFamily: "var(--font-vt323)",
                fontSize: 10,
                lineHeight: 1.1,
                color: GREEN,
                textShadow: `0 0 8px ${GREEN}80`,
                textAlign: "right",
                margin: 0,
              }}
            >
              {ASCII_NUMS[countdown]?.join("\n")}
            </pre>
          ) : (
            <div className="flex items-center gap-2">
              <BpmSparkline history={bpmHistory} />
              <div className="flex flex-col items-end">
                <span
                  className={currentBpm == null ? "animate-pulse" : ""}
                  style={{
                    fontFamily: "var(--font-vt323)",
                    fontSize: 28,
                    color: GREEN,
                    textShadow: `0 0 10px ${GREEN}80`,
                    lineHeight: 1,
                  }}
                >
                  {currentBpm != null ? currentBpm : "---"}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-press-start)",
                    fontSize: 6,
                    color: "#1a8a1a",
                    letterSpacing: 2,
                  }}
                >
                  BPM
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

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
          STATUS: <span className={statusClass}>{statusText}</span>
        </div>
      </div>

      {/* Typewriter narration */}
      {(displayText || isTyping) && (
        <div
          className="text-sm mb-3 leading-relaxed min-h-[40px]"
          style={{ ...textDim, fontFamily: "var(--font-vt323)" }}
        >
          {displayText}
          {isTyping && (
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 14,
                background: "#1a8a1a",
                verticalAlign: "text-bottom",
                marginLeft: 1,
                animation: "cursor-blink 1s step-end infinite",
              }}
            />
          )}
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
        <div>
          SLEEP: {sleep} | READY: {ready}
        </div>
      </div>

      <div className="text-[10px] mb-2" style={textDim}>
        USE ARROW KEYS TO ADJUST VOLUME
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
            handleStop();
            onChangeMood();
          }}
          style={btnAmber}
        >
          MOOD
        </button>
        <button
          onClick={() => {
            handleStop();
            onHome();
          }}
          style={{ ...btnGreen, fontSize: 8 }}
        >
          HOME
        </button>
      </div>
    </div>
  );
}
