"use client";

import { useState, useEffect, useRef } from "react";
import type { AppScreen, MoodState, LyriaParamsRow } from "@/types";
import OnboardingScreen from "@/components/screens/OnboardingScreen";
import MoodSelectorScreen from "@/components/screens/MoodSelectorScreen";
import SessionScreen from "@/components/screens/SessionScreen";
import LegalScreen from "@/components/screens/LegalScreen";

interface ScreenContentProps {
  screen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  targetMood: MoodState | null;
  onMoodSelect: (mood: MoodState) => void;
  sessionId: string | null;
  onSessionStart: (id: string) => void;
  onSessionEnd: () => void;
  lyriaParams: LyriaParamsRow | null;
  audioConnected: boolean;
  ouraConnected: boolean;
}

export default function ScreenContent({
  screen,
  onNavigate,
  targetMood,
  onMoodSelect,
  sessionId,
  onSessionStart,
  onSessionEnd,
  lyriaParams,
  audioConnected,
  ouraConnected,
}: ScreenContentProps) {
  const [transitioning, setTransitioning] = useState(false);
  const [activeScreen, setActiveScreen] = useState(screen);
  const [phase, setPhase] = useState<"idle" | "exit" | "static" | "enter">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (screen !== activeScreen && phase === "idle") {
      // Phase 1: fade out old screen
      setPhase("exit");
      timerRef.current = setTimeout(() => {
        // Phase 2: static burst
        setTransitioning(true);
        setPhase("static");
        timerRef.current = setTimeout(() => {
          // Phase 3: swap screen + fade in
          setActiveScreen(screen);
          setTransitioning(false);
          setPhase("enter");
          timerRef.current = setTimeout(() => {
            setPhase("idle");
          }, 150);
        }, 100);
      }, 150);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [screen, activeScreen, phase]);

  const contentClass =
    phase === "exit"
      ? "screen-exit"
      : phase === "enter"
        ? "screen-enter"
        : "";

  return (
    <div className="relative w-full h-full">
      {transitioning && (
        <div
          className="absolute inset-0 z-50"
          style={{
            background:
              "repeating-linear-gradient(to bottom, transparent, transparent 1px, rgba(255,255,255,0.04) 1px, rgba(255,255,255,0.04) 2px)",
            animation: "static-noise 0.1s steps(4) infinite",
          }}
        />
      )}
      <div className={`w-full h-full ${contentClass}`}>
        {activeScreen === "onboarding" && (
          <OnboardingScreen
            onContinue={() => onNavigate("session")}
            ouraConnected={ouraConnected}
          />
        )}
        {activeScreen === "mood" && (
          <MoodSelectorScreen
            onMoodSelect={(mood) => {
              onMoodSelect(mood);
              onNavigate("session");
            }}
            onBack={() => onNavigate("onboarding")}
          />
        )}
        {activeScreen === "session" && (
          <SessionScreen
            targetMood={targetMood}
            sessionId={sessionId}
            onSessionStart={onSessionStart}
            onSessionEnd={onSessionEnd}
            lyriaParams={lyriaParams}
            audioConnected={audioConnected}
            onChangeMood={() => onNavigate("mood")}
            onHome={() => onNavigate("onboarding")}
          />
        )}
        {activeScreen === "privacy" && (
          <LegalScreen type="privacy" onBack={() => onNavigate("onboarding")} />
        )}
        {activeScreen === "tos" && (
          <LegalScreen type="tos" onBack={() => onNavigate("onboarding")} />
        )}
      </div>
    </div>
  );
}
