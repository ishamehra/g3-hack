"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Extracts real-time bass intensity from an AnalyserNode.
 *
 * Samples bass frequencies (~20-250 Hz) every animation frame and returns
 * a smoothed 0-1 value representing current bass energy. Used to drive
 * Trap-Nation-style visual effects (panel shake, speaker pump, etc.).
 */
export function useBassReactivity(analyser: AnalyserNode | null): number {
  const [bassIntensity, setBassIntensity] = useState(0);
  const smoothedRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!analyser) {
      setBassIntensity(0);
      smoothedRef.current = 0;
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // At 48kHz with fftSize=2048, each bin ≈ 23.4Hz
    // Bass range ~20-250Hz → bins 0 through ~10
    const BASS_END_BIN = 11;

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);

      // Average the bass bins (0-255 range)
      let sum = 0;
      for (let i = 0; i < BASS_END_BIN; i++) {
        sum += dataArray[i];
      }
      const raw = sum / (BASS_END_BIN * 255); // normalize to 0-1

      // Exponential moving average for smooth transitions
      // Fast attack (0.4), slower decay (0.85)
      const prev = smoothedRef.current;
      const smoothed = raw > prev
        ? prev * 0.4 + raw * 0.6   // fast attack
        : prev * 0.85 + raw * 0.15; // slow decay
      smoothedRef.current = smoothed;

      setBassIntensity(smoothed);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [analyser]);

  return bassIntensity;
}
