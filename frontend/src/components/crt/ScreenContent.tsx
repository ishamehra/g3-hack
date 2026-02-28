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
  const [activeScreen, setActiveScreen] = useState(screen);
  const [showStatic, setShowStatic] = useState(false);
  const isFirstSwap = useRef(true);

  useEffect(() => {
    if (screen === activeScreen) return;

    // On first screen change (hydration state restore), swap instantly — no animation
    if (isFirstSwap.current) {
      isFirstSwap.current = false;
      setActiveScreen(screen);
      return;
    }

    // Brief CRT static burst, then swap to new screen
    setShowStatic(true);
    const t = setTimeout(() => {
      setActiveScreen(screen);
      setShowStatic(false);
    }, 150);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  return (
    <div className="relative w-full h-full">
      {showStatic && (
        <div
          className="absolute inset-0 z-50"
          style={{
            background:
              "repeating-linear-gradient(to bottom, transparent, transparent 1px, rgba(255,255,255,0.04) 1px, rgba(255,255,255,0.04) 2px)",
            animation: "static-noise 0.1s steps(4) infinite",
          }}
        />
      )}
      <div
        className="w-full h-full"
        style={{
          opacity: showStatic ? 0 : 1,
          transition: "opacity 100ms ease",
        }}
      >
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
