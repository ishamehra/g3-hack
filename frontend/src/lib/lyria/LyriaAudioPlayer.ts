import { Howl } from "howler";
import type { MusicParams } from "@/types";

export interface TrackInfo {
  audio_url: string;
  params: MusicParams;
  track_number: number;
}

type PlayerState = "idle" | "loading" | "playing" | "crossfading" | "paused" | "error";
type StateListener = (state: PlayerState) => void;

const CROSSFADE_MS = 3000;

export class LyriaAudioPlayer {
  private current: Howl | null = null;
  private next: Howl | null = null;
  private currentTrack: TrackInfo | null = null;
  private state: PlayerState = "idle";
  private stateListeners = new Set<StateListener>();
  private crossfadeTimer: ReturnType<typeof setInterval> | null = null;
  private volume = 1.0;

  get currentState(): PlayerState {
    return this.state;
  }

  get nowPlaying(): TrackInfo | null {
    return this.currentTrack;
  }

  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private setState(s: PlayerState) {
    this.state = s;
    this.stateListeners.forEach((fn) => fn(s));
  }

  /**
   * Load and play a track. If something is already playing, crossfade into the new track.
   */
  async play(track: TrackInfo): Promise<void> {
    if (this.current && this.state === "playing") {
      return this.crossfadeTo(track);
    }
    return this.loadAndPlay(track);
  }

  private loadAndPlay(track: TrackInfo): Promise<void> {
    return new Promise((resolve, reject) => {
      this.setState("loading");

      // Use Web Audio API for blob/data URIs, html5 for remote URLs
      const useHtml5 = !track.audio_url.startsWith("blob:") && !track.audio_url.startsWith("data:");
      const howl = new Howl({
        src: [track.audio_url],
        html5: useHtml5,
        format: useHtml5 ? undefined : ["wav", "mp3"],
        volume: this.volume,
        onload: () => {
          this.cleanup();
          this.current = howl;
          this.currentTrack = track;
          howl.play();
          this.setState("playing");
          resolve();
        },
        onend: () => {
          this.setState("idle");
          this.currentTrack = null;
        },
        onloaderror: (_id, err) => {
          this.setState("error");
          reject(new Error(`Failed to load audio: ${err}`));
        },
      });
    });
  }

  private crossfadeTo(track: TrackInfo): Promise<void> {
    return new Promise((resolve, reject) => {
      this.setState("crossfading");
      const outgoing = this.current;

      const useHtml5 = !track.audio_url.startsWith("blob:") && !track.audio_url.startsWith("data:");
      const incoming = new Howl({
        src: [track.audio_url],
        html5: useHtml5,
        format: useHtml5 ? undefined : ["wav", "mp3"],
        volume: 0,
        onload: () => {
          incoming.play();
          this.next = incoming;

          const steps = 30;
          const interval = CROSSFADE_MS / steps;
          let step = 0;

          this.crossfadeTimer = setInterval(() => {
            step++;
            const progress = step / steps;
            incoming.volume(progress * this.volume);
            outgoing?.volume((1 - progress) * this.volume);

            if (step >= steps) {
              if (this.crossfadeTimer) clearInterval(this.crossfadeTimer);
              this.crossfadeTimer = null;
              outgoing?.unload();
              this.current = incoming;
              this.next = null;
              this.currentTrack = track;
              this.setState("playing");
              resolve();
            }
          }, interval);
        },
        onend: () => {
          this.setState("idle");
          this.currentTrack = null;
        },
        onloaderror: (_id, err) => {
          this.setState("error");
          reject(new Error(`Failed to load next track: ${err}`));
        },
      });
    });
  }

  pause() {
    if (this.current && this.state === "playing") {
      this.current.pause();
      this.setState("paused");
    }
  }

  resume() {
    if (this.current && this.state === "paused") {
      this.current.play();
      this.setState("playing");
    }
  }

  stop() {
    this.cleanup();
    this.setState("idle");
    this.currentTrack = null;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    this.current?.volume(this.volume);
  }

  getVolume(): number {
    return this.volume;
  }

  private cleanup() {
    if (this.crossfadeTimer) {
      clearInterval(this.crossfadeTimer);
      this.crossfadeTimer = null;
    }
    this.current?.unload();
    this.current = null;
    this.next?.unload();
    this.next = null;
  }

  destroy() {
    this.cleanup();
    this.stateListeners.clear();
    this.currentTrack = null;
    this.setState("idle");
  }
}

// Singleton
export const lyriaPlayer = new LyriaAudioPlayer();
