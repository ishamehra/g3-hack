"use client";

import { useState } from "react";
import type { MoodState } from "@/types";
import { useAppState } from "@/hooks/useAppState";
import { useLyriaParams } from "@/hooks/useLyriaParams";
import { useAudioStream } from "@/hooks/useAudioStream";
import CRTMonitor from "@/components/crt/CRTMonitor";
import ScreenContent from "@/components/crt/ScreenContent";
import RadioCDPanel from "@/components/radio/RadioCDPanel";

export default function Home() {
  const { screen, targetMood, goTo, setTargetMood } = useAppState();
  const [sessionId, setSessionId] = useState<string | null>(null);

  const lyriaParams = useLyriaParams(sessionId);
  const { connected: audioConnected, setVolume } = useAudioStream(!!sessionId);

  const handleMoodSelect = (mood: MoodState) => {
    setTargetMood(mood);
    goTo("session");
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="flex items-stretch gap-8">
        <CRTMonitor>
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
          />
        </CRTMonitor>

        <RadioCDPanel
          appScreen={screen}
          lyriaParams={lyriaParams}
          audioConnected={audioConnected}
          onVolumeChange={setVolume}
        />
      </div>
    </main>
  );
}
