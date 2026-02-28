"use client";

import { useState, useEffect } from "react";
import type { AppScreen } from "@/types";
import type { MoodState } from "@/types";
import type { LyriaEngineHandle } from "@/components/session/LyriaEngine";
import type { TrackInfo } from "@/lib/lyria/LyriaAudioPlayer";
import OnboardingScreen from "@/components/screens/OnboardingScreen";
import BiometricScreen from "@/components/screens/BiometricScreen";
import MoodSelectorScreen from "@/components/screens/MoodSelectorScreen";
import SessionScreen from "@/components/screens/SessionScreen";

interface ScreenContentProps {
  screen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  targetMood: MoodState | null;
  onMoodSelect: (mood: MoodState) => void;
  playerState: string;
  engineRef: React.RefObject<LyriaEngineHandle | null>;
  currentTrack: TrackInfo | null;
}

export default function ScreenContent({
  screen,
  onNavigate,
  targetMood,
  onMoodSelect,
  playerState,
  engineRef,
  currentTrack,
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
      {/* Static noise transition overlay */}
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
          playerState={playerState}
          engineRef={engineRef}
          currentTrack={currentTrack}
          onChangeMood={() => onNavigate("mood")}
          onHome={() => onNavigate("onboarding")}
        />
      )}
    </div>
  );
}
