"use client";

import type { MoodState } from "@/types";
import type { LyriaEngineHandle } from "@/components/session/LyriaEngine";
import type { TrackInfo } from "@/lib/lyria/LyriaAudioPlayer";
import {
  textGreen,
  textAmber,
  textDim,
  btnGreen,
  btnAmber,
  separator,
  GREEN,
} from "@/lib/crt-styles";

interface SessionScreenProps {
  targetMood: MoodState | null;
  playerState: string;
  engineRef: React.RefObject<LyriaEngineHandle | null>;
  currentTrack: TrackInfo | null;
  onChangeMood: () => void;
  onHome: () => void;
}

function generateTestToneURL(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const sampleRate = 44100;
    const duration = 10;
    const numSamples = sampleRate * duration;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    const writeStr = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++)
        view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, "RIFF");
    view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, "data");
    view.setUint32(40, numSamples * 2, true);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.min(1, t * 4) * Math.min(1, (duration - t) * 4);
      const sample = Math.sin(2 * Math.PI * 432 * t) * 0.25 * envelope;
      view.setInt16(44 + i * 2, sample * 32767, true);
    }
    const blob = new Blob([buffer], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export default function SessionScreen({
  targetMood,
  playerState,
  engineRef,
  currentTrack,
  onChangeMood,
  onHome,
}: SessionScreenProps) {
  const isPlaying =
    playerState === "playing" || playerState === "crossfading";

  const handlePlay = () => {
    const url = generateTestToneURL();
    if (!url) return;
    engineRef.current?.play({
      audio_url: url,
      params: {
        tempo_bpm: 80,
        mode: "major",
        key: "C",
        harmonic_complexity: 0.3,
        brightness: 0.4,
        dynamic_range: 0.4,
        rhythmic_density: 0.3,
        instrumentation: ["piano", "soft_strings"],
        duration_seconds: 10,
        bridging: false,
      },
      track_number: 1,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm mb-3" style={textAmber}>
        NOW PLAYING
      </h2>

      {currentTrack ? (
        <div className="text-lg space-y-1 mb-3" style={textGreen}>
          <div>
            TRACK {String(currentTrack.track_number).padStart(2, "0")}
          </div>
          <div>
            GENRE:{" "}
            {currentTrack.params.instrumentation.join(", ").toUpperCase()}
          </div>
          <div>
            TEMPO: {currentTrack.params.tempo_bpm} BPM | KEY:{" "}
            {currentTrack.params.key}{" "}
            {currentTrack.params.mode.toUpperCase()}
          </div>
        </div>
      ) : (
        <div className="text-lg mb-3" style={textDim}>
          NO TRACK LOADED
        </div>
      )}

      <div style={separator} />

      <div className="text-lg space-y-1 mb-3" style={textGreen}>
        <div>
          TARGET:{" "}
          <span style={{ ...textAmber, fontFamily: "var(--font-vt323)" }}>
            {targetMood?.label.toUpperCase() ?? "NONE"}
          </span>
        </div>
        <div>
          STATUS:{" "}
          {playerState === "playing"
            ? "GENERATING..."
            : playerState === "loading"
              ? "LOADING..."
              : playerState === "paused"
                ? "PAUSED"
                : "IDLE"}
        </div>
      </div>

      {isPlaying && (
        <div className="text-lg mb-3" style={textGreen}>
          [<span style={{ color: GREEN }}>{"█".repeat(6)}{"░".repeat(4)}</span>
          ] 60%
        </div>
      )}

      <div style={separator} />

      <div className="text-base space-y-1 mb-3" style={textGreen}>
        <div>HR: 072 | HRV: 074 | STRESS: NORMAL</div>
      </div>

      <div className="mt-auto flex gap-3 flex-wrap">
        {!isPlaying && playerState !== "paused" && (
          <button onClick={handlePlay} style={btnGreen}>
            {">"} PLAY
          </button>
        )}
        {isPlaying && (
          <button
            onClick={() => engineRef.current?.pause()}
            style={btnGreen}
          >
            || PAUSE
          </button>
        )}
        {playerState === "paused" && (
          <button
            onClick={() => engineRef.current?.resume()}
            style={btnGreen}
          >
            {">"} RESUME
          </button>
        )}
        {(isPlaying || playerState === "paused") && (
          <button
            onClick={() => engineRef.current?.stop()}
            style={btnGreen}
          >
            [] STOP
          </button>
        )}
        <button onClick={onChangeMood} style={btnAmber}>
          MOOD
        </button>
        <button onClick={onHome} style={{ ...btnGreen, fontSize: 8 }}>
          HOME
        </button>
      </div>
    </div>
  );
}
