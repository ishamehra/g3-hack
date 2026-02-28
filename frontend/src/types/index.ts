// ---- App navigation ----
export type AppScreen = "onboarding" | "biometric" | "mood" | "session" | "oura" | "privacy" | "tos";

// ---- Lyria scale enum (matches backend) ----
export type LyriaScale =
  | "C_MAJOR_A_MINOR"
  | "D_FLAT_MAJOR_B_FLAT_MINOR"
  | "D_MAJOR_B_MINOR"
  | "E_FLAT_MAJOR_C_MINOR"
  | "E_MAJOR_D_FLAT_MINOR"
  | "F_MAJOR_D_MINOR"
  | "G_FLAT_MAJOR_E_FLAT_MINOR"
  | "G_MAJOR_E_MINOR"
  | "A_FLAT_MAJOR_F_MINOR"
  | "A_MAJOR_G_FLAT_MINOR"
  | "B_FLAT_MAJOR_G_MINOR"
  | "B_MAJOR_A_FLAT_MINOR";

export type Quadrant = "Q1" | "Q2" | "Q3" | "Q4";

// ---- Biometric data from Oura (matches backend BiometricData model) ----
export interface BiometricData {
  hr: number | null;
  hrv: number | null;
  stress_pct: number | null;
  sleep_score: number | null;
  readiness_score: number | null;
  deep_sleep_min: number | null;
  rem_sleep_min: number | null;
  sleep_efficiency: number | null;
  temp_delta: number | null;
  hr_lowest: number | null;
  steps: number | null;
  active_calories: number | null;
  resilience_level: string | null;
  spo2_avg: number | null;
}

// ---- This is what you receive from Supabase Realtime (lyria_params table row) ----
export interface LyriaParamsRow {
  session_id: string;
  weighted_prompts: { text: string; weight: number }[];
  bpm: number; // 60-200
  density: number; // 0-1
  brightness: number; // 0-1
  scale: LyriaScale;
  guidance: number; // 0-6
  temperature: number; // 0-3
  mood_label: string; // e.g. "Deep Focus", "Energized"
  instruments: string[]; // e.g. ["piano", "ambient_pad"]
  narration: string; // human-readable explanation
  emotional_state: {
    valence: number; // 0-1
    arousal: number; // 0-1
    quadrant: Quadrant;
    label: string;
  };
  biometrics: BiometricData;
  circadian_phase: string;
  cycle_phase: string | null;
  weather: { temp_f: number; condition: string; humidity?: number } | null;
  updated_at: string;
}

// ---- Session types ----
export type SessionState = "idle" | "connecting" | "active" | "error";

export interface Session {
  id: string;
  target_mood: string;
  genre_preferences: string[];
  created_at: string;
}

// ---- Mood (for UI selection) ----
export interface MoodState {
  valence: number; // 0-1
  arousal: number; // 0-1
  quadrant: Quadrant;
  label: string;
}

// ---- Audio chunk from /ws WebSocket ----
export interface AudioMessage {
  type: "audio";
  audio: string; // base64 encoded PCM: 16-bit, 48kHz, stereo
}
