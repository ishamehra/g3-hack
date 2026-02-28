"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";

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

    const ws = new WebSocket(config.wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = async (event) => {
      let bytes: Uint8Array;

      if (event.data instanceof Blob) {
        // Binary frame — raw PCM bytes
        bytes = new Uint8Array(await event.data.arrayBuffer());
      } else if (typeof event.data === "string") {
        // JSON text frame with base64 audio
        let msg: { type?: string; audio?: string };
        try { msg = JSON.parse(event.data); } catch { return; }
        if (msg.type !== "audio" || !msg.audio) return;
        const raw = atob(msg.audio);
        bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      } else {
        return;
      }

      // 16-bit PCM stereo @ 48kHz
      const samples = bytes.length / 2;
      const buffer = ctx.createBuffer(2, samples / 2, 48000);
      const view = new DataView(bytes.buffer);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);

      for (let i = 0; i < samples / 2; i++) {
        left[i] = view.getInt16(i * 4, true) / 32768;
        right[i] = view.getInt16(i * 4 + 2, true) / 32768;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      source.start();
    };

    return () => {
      ws.close();
      ctx.close();
    };
  }, [active]);

  return { connected, setVolume };
}
