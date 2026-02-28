"use client";

import { useState, useEffect } from "react";
import type { AppScreen, MoodState, LyriaParamsRow } from "@/types";
import OnboardingScreen from "@/components/screens/OnboardingScreen";
import BiometricScreen from "@/components/screens/BiometricScreen";
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
}: ScreenContentProps) {
  const [transitioning, setTransitioning] = useState(false);
  const [activeScreen, setActiveScreen] = useState(screen);

  useEffect(() => {
    if (screen !== activeScreen) {
      setTransitioning(true);
      const timer = setTimeout(() => {
        setActiveScreen(screen);
        setTransitioning(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [screen, activeScreen]);

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
      {activeScreen === "onboarding" && (
        <OnboardingScreen onContinue={() => onNavigate("biometric")} />
      )}
      {activeScreen === "biometric" && (
        <BiometricScreen
          onContinue={() => onNavigate("mood")}
          onBack={() => onNavigate("onboarding")}
        />
      )}
      {activeScreen === "mood" && (
        <MoodSelectorScreen
          onMoodSelect={(mood) => {
            onMoodSelect(mood);
            onNavigate("session");
          }}
          onBack={() => onNavigate("biometric")}
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
  );
}
