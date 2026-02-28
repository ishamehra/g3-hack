"use client";

import { useEffect, useRef, useState } from "react";

const BAR_COUNT = 8;

interface VUMeterProps {
  isPlaying: boolean;
  analyser: AnalyserNode | null;
}

export default function VUMeter({ isPlaying, analyser }: VUMeterProps) {
  const [levels, setLevels] = useState<number[]>(() => new Array(BAR_COUNT).fill(0));
  const rafRef = useRef(0);

  useEffect(() => {
    if (!isPlaying || !analyser) {
      setLevels(new Array(BAR_COUNT).fill(0));
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Map each bar to a frequency band range (logarithmic distribution)
    // At 48kHz/2048 FFT: bin resolution ≈ 23.4Hz, 1024 bins total
    const bandEdges = [0, 3, 6, 12, 24, 48, 96, 192, 400];

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);

      const newLevels = new Array(BAR_COUNT);
      for (let bar = 0; bar < BAR_COUNT; bar++) {
        const start = bandEdges[bar];
        const end = bandEdges[bar + 1];
        let sum = 0;
        for (let i = start; i < end; i++) {
          sum += dataArray[i];
        }
        newLevels[bar] = sum / ((end - start) * 255); // normalize 0-1
      }

      setLevels(newLevels);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, analyser]);

  // Fallback: decorative CSS animation when no analyser is available
  const useFallback = isPlaying && !analyser;

  return (
    <div className="flex items-end gap-[3px]" style={{ height: 48 }}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const level = levels[i] ?? 0;
        const barHeight = useFallback ? undefined : Math.max(4, level * 48);
        const barColor =
          level > 0.8
            ? "#ff4444"
            : level > 0.5
              ? "#ffb000"
              : level > 0.2
                ? "#66ff66"
                : "#33ff33";

        return (
          <div
            key={i}
            style={{
              width: 8,
              borderRadius: "1px 1px 0 0",
              background: useFallback ? "#33ff33" : barColor,
              height: useFallback ? undefined : barHeight,
              animation: useFallback
                ? `vu-bounce 0.6s ease-in-out ${i * 0.08}s infinite alternate`
                : "none",
              transition: analyser ? "height 0.06s ease-out" : "none",
            }}
          />
        );
      })}
    </div>
  );
}
