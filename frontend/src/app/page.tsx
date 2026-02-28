"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MoodState } from "@/types";
import { useAppState } from "@/hooks/useAppState";
import { useLyriaParams } from "@/hooks/useLyriaParams";
import { useAudioStream } from "@/hooks/useAudioStream";
import { useBassReactivity } from "@/hooks/useBassReactivity";
import { useOuraStatus } from "@/hooks/useOuraStatus";
import { isDemoMode } from "@/lib/demo";
import { useDemoTimeline } from "@/hooks/useDemoTimeline";
import { useDemoAutoPilot } from "@/hooks/useDemoAutoPilot";
import CRTMonitor from "@/components/crt/CRTMonitor";
import ScreenContent from "@/components/crt/ScreenContent";
import RadioCDPanel from "@/components/radio/RadioCDPanel";
import BiometricOverlay from "@/components/crt/BiometricOverlay";

export default function Home() {
  const demoMode = isDemoMode();
  const { screen, targetMood, goTo, setTargetMood } = useAppState();
  // Start with defaults to match SSR — restore in useEffect
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(0.7);

  // Demo vs. real data sources
  const realLyriaParams = useLyriaParams(demoMode ? null : sessionId);
  const demoLyriaParams = useDemoTimeline(demoMode && !!sessionId);
  const lyriaParams = demoMode ? demoLyriaParams : realLyriaParams;

  // Audio always uses real stream (Lyria backend)
  const { connected: audioConnected, setVolume: setAudioVolume, analyser } = useAudioStream(!!sessionId);
  const bassIntensity = useBassReactivity(analyser);

  // In demo mode, Oura is always "connected"
  const { isConnected: realOuraConnected } = useOuraStatus();
  const ouraConnected = demoMode ? true : realOuraConnected;

  // Auto-pilot for demo recording (mood switch at t=14s)
  useDemoAutoPilot({ active: demoMode, sessionId, goTo, setTargetMood });

  // Synthetic bass pulsing for demo mode (drives speaker + panel animations)
  const [demoBass, setDemoBass] = useState(0);
  const demoBassRaf = useRef(0);
  useEffect(() => {
    if (!demoMode || !sessionId) { setDemoBass(0); return; }
    const bpm = lyriaParams?.bpm ?? 72;
    const beatMs = 60000 / bpm;
    const tick = () => {
      const beatPos = (Date.now() % beatMs) / beatMs;
      const envelope = beatPos < 0.1 ? beatPos / 0.1 : Math.exp(-(beatPos - 0.1) * 3);
      setDemoBass(envelope * 0.6);
      demoBassRaf.current = requestAnimationFrame(tick);
    };
    demoBassRaf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(demoBassRaf.current);
  }, [demoMode, sessionId, lyriaParams?.bpm]);
  const effectiveBass = demoMode ? demoBass : bassIntensity;

  // Restore persisted state after hydration
  useEffect(() => {
    try {
      const sid = sessionStorage.getItem("resonance_session_id");
      if (sid) setSessionId(sid);
      const vol = sessionStorage.getItem("resonance_volume");
      if (vol) {
        const v = Number(vol);
        setVolumeState(v);
        setAudioVolume(v);
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist sessionId
  useEffect(() => {
    try {
      if (sessionId) sessionStorage.setItem("resonance_session_id", sessionId);
      else sessionStorage.removeItem("resonance_session_id");
    } catch {}
  }, [sessionId]);

  // Persist volume
  useEffect(() => {
    try { sessionStorage.setItem("resonance_volume", String(volume)); } catch {}
  }, [volume]);

  const handleVolumeChange = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setVolumeState(clamped);
      setAudioVolume(clamped);
    },
    [setAudioVolume]
  );

  // Listen for hardware volume keys + arrow keys
  useEffect(() => {
    const STEP = 0.05;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "AudioVolumeUp" || e.key === "ArrowUp") {
        e.preventDefault();
        setVolumeState((prev) => {
          const next = Math.min(1, prev + STEP);
          setAudioVolume(next);
          return next;
        });
      } else if (e.key === "AudioVolumeDown" || e.key === "ArrowDown") {
        e.preventDefault();
        setVolumeState((prev) => {
          const next = Math.max(0, prev - STEP);
          setAudioVolume(next);
          return next;
        });
      } else if (e.key === "AudioVolumeMute") {
        e.preventDefault();
        setVolumeState((prev) => {
          const next = prev > 0 ? 0 : 0.7;
          setAudioVolume(next);
          return next;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setAudioVolume]);

  const handleMoodSelect = (mood: MoodState) => {
    setTargetMood(mood);
    goTo("session");
  };

  const [showBiometrics, setShowBiometrics] = useState(false);
  const isLegalScreen = screen === "privacy" || screen === "tos";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-2 md:p-8">
      <div className="flex flex-col md:flex-row items-center md:items-stretch gap-2 md:gap-6 w-full max-w-[900px] px-1 md:px-0">
        <CRTMonitor
          toggles={[
            { label: "BIO", on: showBiometrics, onToggle: () => setShowBiometrics((p) => !p) },
            { label: "OURA", on: screen === "oura", onToggle: () => {
              goTo(screen === "oura" ? "session" : "oura");
            } },
          ]}
          overlay={showBiometrics ? <BiometricOverlay biometrics={lyriaParams?.biometrics ?? null} /> : undefined}
        >
          <ScreenContent
            screen={screen}
            onNavigate={goTo}
            targetMood={targetMood}
            onMoodSelect={handleMoodSelect}
            sessionId={sessionId}
            onSessionStart={setSessionId}
            onSessionEnd={() => setSessionId(null)}
            lyriaParams={lyriaParams}
            audioConnected={audioConnected}
            ouraConnected={ouraConnected}
          />
        </CRTMonitor>

        <RadioCDPanel
          appScreen={screen}
          lyriaParams={lyriaParams}
          audioConnected={audioConnected}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          bassIntensity={effectiveBass}
          analyser={analyser}
        />
      </div>

      {/* Footer links */}
      <div className="mt-3 flex gap-4 text-center">
        {isLegalScreen ? (
          <button
            onClick={() => goTo("onboarding")}
            className="opacity-50 hover:opacity-100 transition-opacity"
            style={{
              fontFamily: "var(--font-vt323)",
              fontSize: 13,
              color: "#ffb000",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {"<"} RETURN HOME
          </button>
        ) : (
          <>
            <button
              onClick={() => goTo("privacy")}
              className="opacity-30 hover:opacity-70 transition-opacity"
              style={{
                fontFamily: "var(--font-vt323)",
                fontSize: 13,
                color: "#33ff33",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              PRIVACY POLICY
            </button>
            <span style={{ color: "#1a8a1a", fontSize: 13 }}>|</span>
            <button
              onClick={() => goTo("tos")}
              className="opacity-30 hover:opacity-70 transition-opacity"
              style={{
                fontFamily: "var(--font-vt323)",
                fontSize: 13,
                color: "#33ff33",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              TERMS OF SERVICE
            </button>
          </>
        )}
      </div>
    </main>
  );
}
