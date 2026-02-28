"use client";

import type { AppScreen } from "@/types";
import type { LyriaEngineHandle } from "@/components/session/LyriaEngine";
import type { TrackInfo } from "@/lib/lyria/LyriaAudioPlayer";
import CDDrive from "./CDDrive";
import FrequencyDisplay from "./FrequencyDisplay";
import VUMeter from "./VUMeter";
import VolumeKnob from "./VolumeKnob";
import SpeakerGrille from "./SpeakerGrille";

interface RadioCDPanelProps {
  playerState: string;
  currentTrack: TrackInfo | null;
  appScreen: AppScreen;
  engineRef: React.RefObject<LyriaEngineHandle | null>;
}

export default function RadioCDPanel({
  playerState,
  currentTrack,
  appScreen,
  engineRef,
}: RadioCDPanelProps) {
  const isPlaying =
    playerState === "playing" || playerState === "crossfading";

  return (
    <div
      className="flex flex-col items-center gap-4 self-stretch justify-between"
      style={{
        padding: "24px 20px",
        background: "linear-gradient(180deg, #1e1e1e, #141414, #0e0e0e)",
        borderRadius: 16,
        border: "2px solid #222",
        boxShadow:
          "inset 0 1px 2px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.6)",
        width: 220,
      }}
    >
      <CDDrive isPlaying={isPlaying} />
      <FrequencyDisplay
        appScreen={appScreen}
        currentTrack={currentTrack}
        playerState={playerState}
      />
      <VUMeter isPlaying={isPlaying} />
      <VolumeKnob
        onChange={(v) => engineRef.current?.setVolume(v)}
      />
      <SpeakerGrille />
    </div>
  );
}
