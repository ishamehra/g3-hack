"use client";

import { useRef, useState } from "react";
import LyriaEngine, {
  type LyriaEngineHandle,
} from "@/components/session/LyriaEngine";

/**
 * Generate a test tone as a data URI using Web Audio API.
 * This avoids any CORS issues — runs purely client-side.
 */
function generateTestToneURL(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const sampleRate = 44100;
    const duration = 5;
    const numSamples = sampleRate * duration;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = numSamples * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // WAV header
    const writeStr = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };
    writeStr(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeStr(36, "data");
    view.setUint32(40, dataSize, true);

    // Generate a gentle sine wave at 432Hz
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.min(1, t * 4) * Math.min(1, (duration - t) * 4);
      const sample = Math.sin(2 * Math.PI * 432 * t) * 0.3 * envelope;
      view.setInt16(44 + i * 2, sample * 32767, true);
    }

    const blob = new Blob([buffer], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

const TEST_PARAMS = {
  tempo_bpm: 80,
  mode: "major" as const,
  key: "C",
  harmonic_complexity: 0.3,
  brightness: 0.4,
  dynamic_range: 0.4,
  rhythmic_density: 0.3,
  instrumentation: ["piano", "soft_strings"],
  duration_seconds: 5,
  bridging: false,
};

export default function SessionPage() {
  const engineRef = useRef<LyriaEngineHandle>(null);
  const [playerState, setPlayerState] = useState("idle");
  const [error, setError] = useState<string | null>(null);

  const handleTestPlay = () => {
    setError(null);
    const url = generateTestToneURL();
    if (!url) {
      setError("Could not generate test tone");
      return;
    }
    engineRef.current
      ?.play({ audio_url: url, params: TEST_PARAMS, track_number: 1 })
      .catch((e) => setError(String(e)));
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">Session</h1>

      <LyriaEngine ref={engineRef} onStateChange={setPlayerState} />

      <div className="flex gap-3">
        <button
          onClick={handleTestPlay}
          className="rounded-full bg-primary px-6 py-2 text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          Test Play
        </button>
        <button
          onClick={() => engineRef.current?.stop()}
          className="rounded-full bg-muted px-6 py-2 font-medium hover:opacity-80 transition-opacity"
        >
          Stop
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Player state: <span className="font-mono">{playerState}</span>
      </p>
      {error && (
        <p className="text-sm text-red-400 max-w-md text-center">{error}</p>
      )}
    </main>
  );
}
