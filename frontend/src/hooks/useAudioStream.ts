"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";

/**
 * Streams PCM audio from the backend Lyria relay over WebSocket.
 *
 * Backend sends raw binary WebSocket frames (16-bit PCM, 48kHz, stereo).
 * We schedule chunks on a running clock so they play back-to-back with
 * zero gaps or overlaps. We pre-buffer 3 chunks before starting playback
 * to absorb network jitter.
 */
export function useAudioStream(active: boolean) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const setVolume = useCallback((v: number) => {
    if (gainRef.current) gainRef.current.gain.value = Math.max(0, Math.min(1, v));
  }, []);

  useEffect(() => {
    if (!active) return;

    const ctx = new AudioContext({ sampleRate: 48000 });
    ctxRef.current = ctx;

    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gainRef.current = gain;

    // Scheduling state
    let nextPlayTime = 0;
    let started = false;
    const preBuffer: AudioBuffer[] = [];
    const PRE_BUFFER_COUNT = 3; // Buffer 3 chunks before starting (~0.75s)

    const ws = new WebSocket(config.wsUrl);
    ws.binaryType = "arraybuffer"; // Receive binary frames directly
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      // Handle binary frames (raw PCM audio)
      if (event.data instanceof ArrayBuffer) {
        const bytes = new Uint8Array(event.data);
        const buffer = decodePCM(bytes, ctx);
        if (!buffer) return;

        if (!started) {
          // Pre-buffer phase: accumulate chunks before starting playback
          preBuffer.push(buffer);
          if (preBuffer.length >= PRE_BUFFER_COUNT) {
            started = true;
            nextPlayTime = ctx.currentTime + 0.05; // 50ms lead-in
            for (const buf of preBuffer) {
              scheduleBuffer(buf, ctx, gain, nextPlayTime);
              nextPlayTime += buf.duration;
            }
            preBuffer.length = 0;
          }
          return;
        }

        // Normal playback: schedule at next available slot
        const now = ctx.currentTime;
        if (nextPlayTime < now) {
          // Buffer underrun — we fell behind. Jump ahead with small lead.
          nextPlayTime = now + 0.02;
        }
        scheduleBuffer(buffer, ctx, gain, nextPlayTime);
        nextPlayTime += buffer.duration;
        return;
      }

      // Handle JSON text frames (future: control messages)
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "audio" && msg.audio) {
          // Legacy base64 fallback (shouldn't happen with updated backend)
          const raw = atob(msg.audio);
          const bytes = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
          const buffer = decodePCM(bytes, ctx);
          if (buffer) {
            const now = ctx.currentTime;
            if (nextPlayTime < now) nextPlayTime = now + 0.02;
            scheduleBuffer(buffer, ctx, gain, nextPlayTime);
            nextPlayTime += buffer.duration;
          }
        }
      } catch {
        // Ignore parse errors for non-JSON binary data
      }
    };

    return () => {
      ws.close();
      ctx.close();
    };
  }, [active]);

  return { connected, setVolume };
}

/** Decode raw 16-bit PCM stereo bytes into an AudioBuffer. */
function decodePCM(bytes: Uint8Array, ctx: AudioContext): AudioBuffer | null {
  if (bytes.length < 4) return null;

  const samples = bytes.length / 2; // total samples (L + R interleaved)
  const framesPerChannel = samples / 2; // frames per channel
  const buffer = ctx.createBuffer(2, framesPerChannel, 48000);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < framesPerChannel; i++) {
    left[i] = view.getInt16(i * 4, true) / 32768;
    right[i] = view.getInt16(i * 4 + 2, true) / 32768;
  }

  return buffer;
}

/** Schedule an AudioBuffer to play at a specific time. */
function scheduleBuffer(
  buffer: AudioBuffer,
  ctx: AudioContext,
  gain: GainNode,
  when: number,
) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(gain);
  source.start(when);
}
