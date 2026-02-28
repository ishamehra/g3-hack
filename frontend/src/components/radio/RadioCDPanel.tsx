"use client";

import type { AppScreen, LyriaParamsRow } from "@/types";
import CDDrive from "./CDDrive";
import FrequencyDisplay from "./FrequencyDisplay";
import VUMeter from "./VUMeter";
import VolumeKnob from "./VolumeKnob";
import SpeakerGrille from "./SpeakerGrille";

interface RadioCDPanelProps {
  appScreen: AppScreen;
  lyriaParams: LyriaParamsRow | null;
  audioConnected: boolean;
  onVolumeChange: (v: number) => void;
}

export default function RadioCDPanel({
  appScreen,
  lyriaParams,
  audioConnected,
  onVolumeChange,
}: RadioCDPanelProps) {
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
      <CDDrive isPlaying={audioConnected} />
      <FrequencyDisplay
        appScreen={appScreen}
        lyriaParams={lyriaParams}
        audioConnected={audioConnected}
      />
      <VUMeter isPlaying={audioConnected} />
      <VolumeKnob onChange={onVolumeChange} />
      <SpeakerGrille />
    </div>
  );
}
