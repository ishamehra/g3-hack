"use client";

import { useState } from "react";
import { config } from "@/lib/config";
import { useLyriaParams } from "@/hooks/useLyriaParams";
import { useAudioStream } from "@/hooks/useAudioStream";

export default function SessionPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lyriaParams = useLyriaParams(sessionId);
  const { connected } = useAudioStream(!!sessionId);

  const handleStart = async () => {
    setError(null);
    try {
      const res = await fetch(`${config.apiUrl}/api/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_mood: "calm", genres: ["ambient"] }),
      });
      const data = await res.json();
      setSessionId(data.session_id);
    } catch (e) {
      setError(String(e));
    }
  };

  const handleStop = async () => {
    try {
      await fetch(`${config.apiUrl}/api/session/stop`, { method: "POST" });
    } catch {
      // ignore
    }
    setSessionId(null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">Session Test</h1>

      <div className="flex gap-3">
        <button
          onClick={handleStart}
          disabled={!!sessionId}
          className="rounded-full bg-primary px-6 py-2 text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Start Session
        </button>
        <button
          onClick={handleStop}
          disabled={!sessionId}
          className="rounded-full bg-muted px-6 py-2 font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          Stop
        </button>
      </div>

      <div className="text-sm text-muted-foreground space-y-1 text-center">
        <p>Session: <span className="font-mono">{sessionId ?? "none"}</span></p>
        <p>Audio WS: <span className="font-mono">{connected ? "connected" : "disconnected"}</span></p>
        {lyriaParams && (
          <p>BPM: {lyriaParams.bpm} | Mood: {lyriaParams.mood_label}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 max-w-md text-center">{error}</p>
      )}
    </main>
  );
}
