// ---- Biometric types ----

export interface BiometricSnapshot {
  timestamp: string;
  hrv_ms: number;
  rhr_bpm: number;
  skin_temp_delta_c: number;
  stress_score: number;
  normalized: {
    arousal: number; // 0-1
    autonomic_balance: number; // 0-1
  };
}

// ---- Mood / Circumplex types ----

export type Quadrant = "Q1" | "Q2" | "Q3" | "Q4";

export interface MoodState {
  valence: number; // 0-1
  arousal: number; // 0-1
  quadrant: Quadrant;
  label: string;
}

// ---- Music params ----

export interface MusicParams {
  tempo_bpm: number;
  mode: "major" | "minor" | "mixed";
  key: string;
  harmonic_complexity: number;
  brightness: number;
  dynamic_range: number;
  rhythmic_density: number;
  instrumentation: string[];
  duration_seconds: number;
  bridging: boolean;
  bridge_start_tempo?: number;
  bridge_start_mode?: string;
}

export interface LyriaParams {
  session_id: string;
  music_params: MusicParams;
  prompt: string;
  updated_at: string;
}

// ---- Session types ----

export type SessionState =
  | "idle"
  | "connecting"
  | "active"
  | "generating"
  | "target_approaching"
  | "target_reached"
  | "complete"
  | "error";

export interface Session {
  id: string;
  user_id: string;
  target_mood: MoodState;
  current_mood: MoodState | null;
  state: SessionState;
  created_at: string;
}

// ---- User preferences ----

export interface GenrePreference {
  genres: string[];
  custom: string | null;
}

export interface UserPreferences {
  Q1_energized: GenrePreference;
  Q3_reflective: GenrePreference;
  Q4_calm: GenrePreference;
  Q1Q4_focused: GenrePreference;
}
