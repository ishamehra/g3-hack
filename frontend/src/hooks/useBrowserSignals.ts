"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const POST_INTERVAL_MS = 10_000;

interface EngagementSignals {
  is_visible: boolean;
  idle_seconds: number;
  tab_switches: number;
}

interface DigitalStressSignals {
  typing_cps: number;
  pause_avg_ms: number;
  mouse_velocity: number;
  click_rate: number;
}

interface MotionSignals {
  intensity: number;
  stability: number;
}

interface AmbientSignals {
  db: number;
  noise_type: string;
}

interface BrowserSignalsPayload {
  engagement: EngagementSignals;
  digital_stress: DigitalStressSignals;
  motion: MotionSignals;
  ambient: AmbientSignals;
}

function classifyNoise(db: number): string {
  if (db < 30) return "quiet";
  if (db < 50) return "moderate";
  if (db < 70) return "noisy";
  return "loud";
}

export function useBrowserSignals(active: boolean) {
  // Permission states
  const [hasMotion, setHasMotion] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  // Refs for tracking signals across the 10s window
  const keyTimestamps = useRef<number[]>([]);
  const clickTimestamps = useRef<number[]>([]);
  const mousePositions = useRef<{ x: number; y: number; t: number }[]>([]);
  const lastInteraction = useRef<number>(Date.now());
  const tabSwitches = useRef<number>(0);

  // DeviceMotion refs
  const motionSamples = useRef<number[]>([]);

  // Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const ambientDb = useRef<number>(0);

  // Request DeviceMotion permission (iOS requires explicit request)
  const requestMotionPermission = useCallback(async () => {
    try {
      const DME = DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (typeof DME.requestPermission === "function") {
        const result = await DME.requestPermission();
        if (result === "granted") {
          setHasMotion(true);
          return true;
        }
        return false;
      }
      // Non-iOS: permission not needed
      setHasMotion(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Request microphone for ambient audio level
  const requestAudioPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      setHasAudio(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Sample ambient audio dB
  const sampleAudioDb = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return 0;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(data);
    // RMS calculation
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const normalized = (data[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / data.length);
    // Convert to dB (approximate, 0-100 range)
    const db = rms > 0 ? 20 * Math.log10(rms) + 90 : 0;
    return Math.max(0, Math.min(100, db));
  }, []);

  // Collect and POST signals
  useEffect(() => {
    if (!active) return;

    const now = () => Date.now();

    // Event handlers
    const onKeyDown = () => {
      const t = now();
      keyTimestamps.current.push(t);
      lastInteraction.current = t;
    };

    const onClick = () => {
      const t = now();
      clickTimestamps.current.push(t);
      lastInteraction.current = t;
    };

    const onMouseMove = (e: MouseEvent) => {
      const t = now();
      mousePositions.current.push({ x: e.clientX, y: e.clientY, t });
      lastInteraction.current = t;
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        tabSwitches.current++;
      }
    };

    const onDeviceMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (acc && acc.x != null && acc.y != null && acc.z != null) {
        const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
        // Subtract gravity (~9.81) to get movement intensity
        motionSamples.current.push(Math.abs(magnitude - 9.81));
      }
    };

    // Attach listeners
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("click", onClick);
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("visibilitychange", onVisibilityChange);

    if (hasMotion) {
      window.addEventListener("devicemotion", onDeviceMotion);
    }

    // POST interval
    const intervalId = setInterval(() => {
      const windowSec = POST_INTERVAL_MS / 1000;
      const currentTime = now();

      // -- Engagement --
      const engagement: EngagementSignals = {
        is_visible: !document.hidden,
        idle_seconds: Math.round((currentTime - lastInteraction.current) / 1000),
        tab_switches: tabSwitches.current,
      };

      // -- Digital Stress --
      const keys = keyTimestamps.current;
      const typing_cps = keys.length / windowSec;

      let pause_avg_ms = 0;
      if (keys.length > 1) {
        let totalPause = 0;
        for (let i = 1; i < keys.length; i++) {
          totalPause += keys[i] - keys[i - 1];
        }
        pause_avg_ms = Math.round(totalPause / (keys.length - 1));
      }

      const clicks = clickTimestamps.current;
      const click_rate = clicks.length / windowSec;

      // Mouse velocity: average distance per second
      const positions = mousePositions.current;
      let totalDistance = 0;
      for (let i = 1; i < positions.length; i++) {
        const dx = positions[i].x - positions[i - 1].x;
        const dy = positions[i].y - positions[i - 1].y;
        totalDistance += Math.sqrt(dx * dx + dy * dy);
      }
      const mouse_velocity = windowSec > 0 ? Math.round(totalDistance / windowSec) : 0;

      const digital_stress: DigitalStressSignals = {
        typing_cps: Math.round(typing_cps * 100) / 100,
        pause_avg_ms,
        mouse_velocity,
        click_rate: Math.round(click_rate * 100) / 100,
      };

      // -- Motion --
      const samples = motionSamples.current;
      let intensity = 0;
      let stability = 1;
      if (samples.length > 0) {
        const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
        intensity = Math.min(1, mean / 5); // Normalize: 5 m/s^2 = max intensity
        const variance =
          samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length;
        stability = Math.max(0, 1 - Math.min(1, Math.sqrt(variance) / 3));
      }
      const motion: MotionSignals = {
        intensity: Math.round(intensity * 100) / 100,
        stability: Math.round(stability * 100) / 100,
      };

      // -- Ambient Audio --
      const db = hasAudio ? sampleAudioDb() : 0;
      ambientDb.current = db;
      const ambient: AmbientSignals = {
        db: Math.round(db),
        noise_type: hasAudio ? classifyNoise(db) : "unknown",
      };

      // Build payload
      const payload: BrowserSignalsPayload = {
        engagement,
        digital_stress,
        motion,
        ambient,
      };

      // POST to backend (fire-and-forget)
      fetch(`${API_URL}/api/signals/browser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Silently ignore network errors
      });

      // Reset accumulators for next window
      keyTimestamps.current = [];
      clickTimestamps.current = [];
      mousePositions.current = [];
      motionSamples.current = [];
      // Keep tab_switches as cumulative
    }, POST_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("click", onClick);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (hasMotion) {
        window.removeEventListener("devicemotion", onDeviceMotion);
      }
    };
  }, [active, hasMotion, hasAudio, sampleAudioDb]);

  // Cleanup audio resources on unmount
  useEffect(() => {
    return () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return { requestMotionPermission, requestAudioPermission, hasMotion, hasAudio };
}
