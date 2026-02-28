"use client";

import { useRef, useState } from "react";
import LyriaEngine, {
  type LyriaEngineHandle,
} from "@/components/session/LyriaEngine";
import type { TrackInfo } from "@/lib/lyria/LyriaAudioPlayer";
import type { MoodState } from "@/types";
import { useAppState } from "@/hooks/useAppState";
import CRTMonitor from "@/components/crt/CRTMonitor";
import ScreenContent from "@/components/crt/ScreenContent";
import RadioCDPanel from "@/components/radio/RadioCDPanel";

export default function Home() {
  const engineRef = useRef<LyriaEngineHandle>(null);
  const [playerState, setPlayerState] = useState("idle");
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const { screen, targetMood, goTo, setTargetMood } = useAppState();

  const handleMoodSelect = (mood: MoodState) => {
    setTargetMood(mood);
    goTo("session");
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      {/* Hidden audio engine — no visual output */}
      <div className="hidden">
        <LyriaEngine
          ref={engineRef}
          onStateChange={setPlayerState}
          onTrackChange={setCurrentTrack}
        />
      </div>

      <div className="flex items-stretch gap-8">
      <CRTMonitor>
        <ScreenContent
          screen={screen}
          onNavigate={goTo}
          targetMood={targetMood}
          onMoodSelect={handleMoodSelect}
          playerState={playerState}
          engineRef={engineRef}
          currentTrack={currentTrack}
        />
      </CRTMonitor>

      <RadioCDPanel
        playerState={playerState}
        currentTrack={currentTrack}
        appScreen={screen}
        engineRef={engineRef}
      />
      </div>
    </main>
  );
}
