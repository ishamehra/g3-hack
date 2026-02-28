"use client";

import { useLyriaPlayer } from "@/hooks/useLyriaPlayer";
import type { TrackInfo } from "@/lib/lyria/LyriaAudioPlayer";
import { useEffect, useImperativeHandle, forwardRef } from "react";

export interface LyriaEngineHandle {
  play: (track: TrackInfo) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVolume: (v: number) => void;
}

interface LyriaEngineProps {
  onStateChange?: (state: string) => void;
  onTrackChange?: (track: TrackInfo | null) => void;
}

const LyriaEngine = forwardRef<LyriaEngineHandle, LyriaEngineProps>(
  ({ onStateChange, onTrackChange }, ref) => {
    const { state, track, play, pause, resume, stop, setVolume } =
      useLyriaPlayer();

    useImperativeHandle(ref, () => ({ play, pause, resume, stop, setVolume }), [
      play,
      pause,
      resume,
      stop,
      setVolume,
    ]);

    useEffect(() => {
      onStateChange?.(state);
    }, [state, onStateChange]);

    useEffect(() => {
      onTrackChange?.(track);
    }, [track, onTrackChange]);

    return (
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              state === "playing" || state === "crossfading"
                ? "bg-green-500 animate-pulse"
                : state === "loading"
                  ? "bg-yellow-500 animate-pulse"
                  : state === "error"
                    ? "bg-red-500"
                    : "bg-muted-foreground/40"
            }`}
          />
          <span className="text-muted-foreground capitalize">{state}</span>
        </div>

        {track && (
          <span className="text-muted-foreground truncate max-w-[200px]">
            Track #{track.track_number}
          </span>
        )}

        {(state === "playing" || state === "crossfading") && (
          <button
            onClick={pause}
            className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80"
          >
            Pause
          </button>
        )}
        {state === "paused" && (
          <button
            onClick={resume}
            className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80"
          >
            Resume
          </button>
        )}
      </div>
    );
  }
);

LyriaEngine.displayName = "LyriaEngine";
export default LyriaEngine;
