"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LyriaAudioPlayer, type TrackInfo } from "@/lib/lyria/LyriaAudioPlayer";

type PlayerState = "idle" | "loading" | "playing" | "crossfading" | "paused" | "error";

export function useLyriaPlayer() {
  const playerRef = useRef<LyriaAudioPlayer | null>(null);
  const [state, setState] = useState<PlayerState>("idle");
  const [track, setTrack] = useState<TrackInfo | null>(null);

  useEffect(() => {
    const player = new LyriaAudioPlayer();
    playerRef.current = player;

    const unsub = player.onStateChange((s) => {
      setState(s);
      setTrack(player.nowPlaying);
    });

    return () => {
      unsub();
      player.destroy();
    };
  }, []);

  const play = useCallback(async (t: TrackInfo) => {
    await playerRef.current?.play(t);
  }, []);

  const pause = useCallback(() => playerRef.current?.pause(), []);
  const resume = useCallback(() => playerRef.current?.resume(), []);
  const stop = useCallback(() => playerRef.current?.stop(), []);

  const setVolume = useCallback((v: number) => {
    playerRef.current?.setVolume(v);
  }, []);

  return { state, track, play, pause, resume, stop, setVolume };
}
