"use client";

import type { AppScreen, LyriaParamsRow } from "@/types";
import CDDrive from "./CDDrive";
import FrequencyDisplay from "./FrequencyDisplay";
import VUMeter from "./VUMeter";
import VolumeKnob from "./VolumeKnob";
import VolumeBar from "./VolumeBar";
import SpeakerGrille from "./SpeakerGrille";

interface RadioCDPanelProps {
  appScreen: AppScreen;
  lyriaParams: LyriaParamsRow | null;
  audioConnected: boolean;
  volume: number;
  onVolumeChange: (v: number) => void;
  bassIntensity?: number;
  analyser?: AnalyserNode | null;
}

export default function RadioCDPanel({
  appScreen,
  lyriaParams,
  audioConnected,
  volume,
  onVolumeChange,
  bassIntensity = 0,
  analyser,
}: RadioCDPanelProps) {
  const scale = 1 + bassIntensity * 0.04;

  return (
    <div
      className="
        flex items-center justify-around gap-4
        w-full py-5
        md:flex-col md:items-center md:justify-between md:self-stretch
        md:w-[220px] md:py-6
      "
      style={{
        paddingLeft: 20,
        paddingRight: 20,
        background: "linear-gradient(180deg, #1e1e1e, #141414, #0e0e0e)",
        borderRadius: 16,
        border: "2px solid #222",
        boxShadow:
          "inset 0 1px 2px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.6)",
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        willChange: "transform",
        transition: "transform 0.05s ease-out",
      }}
    >
      {/* CD Drive — hidden on mobile, shown on desktop */}
      <div className="hidden md:block">
        <CDDrive isPlaying={audioConnected} />
      </div>

      <VUMeter isPlaying={audioConnected} analyser={analyser ?? null} />

      <FrequencyDisplay
        appScreen={appScreen}
        lyriaParams={lyriaParams}
        audioConnected={audioConnected}
      />

      <div className="flex flex-col items-center gap-2 w-full md:w-auto">
        <VolumeBar volume={volume} onChange={onVolumeChange} />
        <VolumeKnob volume={volume} onChange={onVolumeChange} />
      </div>

      {/* Speaker — hidden on mobile, shown on desktop */}
      <div className="hidden md:block">
        <SpeakerGrille bassIntensity={bassIntensity} />
      </div>
    </div>
  );
}
