import type { LyriaParamsRow } from "@/types";

export interface DemoKeyframe {
  t: number; // seconds after session begins
  data: LyriaParamsRow;
}

const SESSION_ID = "demo-session-001";

const FOCUS_BIO_EMPTY: LyriaParamsRow["biometrics"] = {
  hr: null,
  hrv: null,
  stress_pct: null,
  sleep_score: null,
  readiness_score: null,
  deep_sleep_min: null,
  rem_sleep_min: null,
  sleep_efficiency: null,
  temp_delta: null,
  hr_lowest: null,
  steps: null,
  active_calories: null,
  resilience_level: null,
  spo2_avg: null,
  digital_stress_score: null,
  motion_intensity: null,
  ambient_db: null,
  engagement_level: null,
};

const FOCUS_BASE: LyriaParamsRow = {
  session_id: SESSION_ID,
  weighted_prompts: [
    { text: "gentle ambient piano, soft pads, introspective calm", weight: 1.0 },
    { text: "low-tempo minimalist focus music", weight: 0.7 },
  ],
  bpm: 72,
  density: 0.3,
  brightness: 0.4,
  scale: "C_MAJOR_A_MINOR",
  guidance: 3.5,
  temperature: 1.2,
  mood_label: "Deep Focus",
  instruments: ["piano", "ambient_pad"],
  narration: "",
  emotional_state: {
    valence: 0.35,
    arousal: 0.25,
    quadrant: "Q3",
    label: "Focused & Calm",
  },
  biometrics: FOCUS_BIO_EMPTY,
  circadian_phase: "morning_peak",
  cycle_phase: null,
  weather: { temp_f: 68, condition: "clear", humidity: 45 },
  updated_at: new Date().toISOString(),
};

const BIO_FULL: LyriaParamsRow["biometrics"] = {
  hr: 62,
  hrv: 48,
  stress_pct: 18,
  sleep_score: 82,
  readiness_score: 78,
  deep_sleep_min: 95,
  rem_sleep_min: 88,
  sleep_efficiency: 91,
  temp_delta: -0.2,
  hr_lowest: 52,
  steps: 3421,
  active_calories: 180,
  resilience_level: "strong",
  spo2_avg: 97.5,
  digital_stress_score: 0.15,
  motion_intensity: 0.1,
  ambient_db: 35,
  engagement_level: 0.9,
};

export const DEMO_KEYFRAMES: DemoKeyframe[] = [
  // t=0: Session started, no biometrics yet
  {
    t: 0,
    data: {
      ...FOCUS_BASE,
      narration: "Initializing biometric link...",
    },
  },

  // t=2: First biometrics arrive
  {
    t: 2,
    data: {
      ...FOCUS_BASE,
      biometrics: { ...BIO_FULL },
      narration: "Biometrics locked. Heart rate steady at 62 BPM. Low stress detected.",
    },
  },

  // t=5: Gemini narration updates, biometrics fluctuate
  {
    t: 5,
    data: {
      ...FOCUS_BASE,
      bpm: 70,
      biometrics: {
        ...BIO_FULL,
        hr: 60,
        hrv: 51,
        stress_pct: 15,
        digital_stress_score: 0.12,
        motion_intensity: 0.08,
        ambient_db: 33,
        engagement_level: 0.95,
      },
      narration:
        "Your readiness score of 78 and low stress suggest a calm morning. Generating ambient piano with soft harmonic pads at 70 BPM to deepen focus.",
    },
  },

  // t=8: Deepening focus
  {
    t: 8,
    data: {
      ...FOCUS_BASE,
      bpm: 68,
      density: 0.25,
      biometrics: {
        ...BIO_FULL,
        hr: 58,
        hrv: 53,
        stress_pct: 12,
        temp_delta: -0.1,
        spo2_avg: 98.0,
        digital_stress_score: 0.1,
        motion_intensity: 0.05,
        ambient_db: 32,
        engagement_level: 0.97,
      },
      narration:
        "HRV rising to 53ms \u2014 entering deep focus state. Reducing density to let the music breathe.",
    },
  },

  // t=12: Stable deep focus
  {
    t: 12,
    data: {
      ...FOCUS_BASE,
      bpm: 68,
      density: 0.25,
      brightness: 0.35,
      biometrics: {
        ...BIO_FULL,
        hr: 59,
        hrv: 55,
        stress_pct: 10,
        temp_delta: -0.1,
        spo2_avg: 98.0,
        digital_stress_score: 0.08,
        motion_intensity: 0.03,
        ambient_db: 30,
        engagement_level: 1.0,
      },
      narration:
        "Stress dropping to 10%. Circadian peak detected \u2014 optimal conditions for flow state.",
    },
  },

  // ── MOOD SWITCH TO ENERGIZED ──────────────────────────────

  // t=15: Immediate shift
  {
    t: 15,
    data: {
      session_id: SESSION_ID,
      weighted_prompts: [
        { text: "high-energy electronic synth, driving drums, euphoric", weight: 1.0 },
        { text: "intense uplifting EDM with electric bass groove", weight: 0.8 },
      ],
      bpm: 100,
      density: 0.55,
      brightness: 0.6,
      scale: "E_MAJOR_D_FLAT_MINOR",
      guidance: 4.2,
      temperature: 1.8,
      mood_label: "Energized",
      instruments: ["synth_lead", "drums", "electric_bass"],
      narration: "Mood shift detected. Switching to high-energy mode...",
      emotional_state: {
        valence: 0.4,
        arousal: 0.75,
        quadrant: "Q1",
        label: "Energized & Driven",
      },
      biometrics: {
        ...BIO_FULL,
        hr: 65,
        hrv: 45,
        stress_pct: 22,
        temp_delta: 0.0,
        spo2_avg: 97.0,
        digital_stress_score: 0.2,
        motion_intensity: 0.3,
        ambient_db: 42,
        engagement_level: 1.0,
      },
      circadian_phase: "morning_peak",
      cycle_phase: null,
      weather: { temp_f: 68, condition: "clear", humidity: 45 },
      updated_at: new Date().toISOString(),
    },
  },

  // t=18: Ramping up
  {
    t: 18,
    data: {
      session_id: SESSION_ID,
      weighted_prompts: [
        { text: "high-energy electronic synth, driving drums, euphoric", weight: 1.0 },
        { text: "intense uplifting EDM with electric bass groove", weight: 0.8 },
      ],
      bpm: 118,
      density: 0.7,
      brightness: 0.75,
      scale: "E_MAJOR_D_FLAT_MINOR",
      guidance: 4.5,
      temperature: 2.0,
      mood_label: "Energized",
      instruments: ["synth_lead", "drums", "electric_bass"],
      narration:
        "Ramping energy. BPM climbing to 118, adding driving drums and synth lead. Heart rate responding \u2014 up to 68 BPM.",
      emotional_state: {
        valence: 0.45,
        arousal: 0.85,
        quadrant: "Q1",
        label: "Energized & Driven",
      },
      biometrics: {
        ...BIO_FULL,
        hr: 68,
        hrv: 42,
        stress_pct: 28,
        temp_delta: 0.1,
        spo2_avg: 97.0,
        digital_stress_score: 0.25,
        motion_intensity: 0.5,
        ambient_db: 48,
        engagement_level: 1.0,
      },
      circadian_phase: "morning_peak",
      cycle_phase: null,
      weather: { temp_f: 68, condition: "clear", humidity: 45 },
      updated_at: new Date().toISOString(),
    },
  },

  // t=22: Peak energy
  {
    t: 22,
    data: {
      session_id: SESSION_ID,
      weighted_prompts: [
        { text: "peak energy euphoric electronic synth anthem", weight: 1.0 },
        { text: "pulsing bass with crisp hi-hats and soaring leads", weight: 0.9 },
      ],
      bpm: 128,
      density: 0.8,
      brightness: 0.85,
      scale: "E_MAJOR_D_FLAT_MINOR",
      guidance: 5.0,
      temperature: 2.2,
      mood_label: "Energized",
      instruments: ["synth_lead", "drums", "electric_bass"],
      narration:
        "Peak energy reached. 128 BPM with full density. Your biometrics show elevated arousal \u2014 the music is resonating with your body.",
      emotional_state: {
        valence: 0.5,
        arousal: 0.9,
        quadrant: "Q1",
        label: "Peak Energy",
      },
      biometrics: {
        ...BIO_FULL,
        hr: 72,
        hrv: 38,
        stress_pct: 35,
        temp_delta: 0.2,
        spo2_avg: 96.5,
        digital_stress_score: 0.3,
        motion_intensity: 0.7,
        ambient_db: 55,
        engagement_level: 1.0,
      },
      circadian_phase: "morning_peak",
      cycle_phase: null,
      weather: { temp_f: 68, condition: "clear", humidity: 45 },
      updated_at: new Date().toISOString(),
    },
  },

  // t=26: Sustained peak with slight variation
  {
    t: 26,
    data: {
      session_id: SESSION_ID,
      weighted_prompts: [
        { text: "peak energy euphoric electronic synth anthem", weight: 1.0 },
        { text: "pulsing bass with crisp hi-hats and soaring leads", weight: 0.9 },
      ],
      bpm: 126,
      density: 0.78,
      brightness: 0.82,
      scale: "E_MAJOR_D_FLAT_MINOR",
      guidance: 4.8,
      temperature: 2.1,
      mood_label: "Energized",
      instruments: ["synth_lead", "drums", "electric_bass"],
      narration:
        "Closed-loop adaptation active. Music parameters continuously tuning to your physiological state in real time.",
      emotional_state: {
        valence: 0.5,
        arousal: 0.88,
        quadrant: "Q1",
        label: "Peak Energy",
      },
      biometrics: {
        ...BIO_FULL,
        hr: 70,
        hrv: 40,
        stress_pct: 32,
        temp_delta: 0.2,
        spo2_avg: 96.8,
        digital_stress_score: 0.28,
        motion_intensity: 0.65,
        ambient_db: 52,
        engagement_level: 1.0,
      },
      circadian_phase: "morning_peak",
      cycle_phase: null,
      weather: { temp_f: 68, condition: "clear", humidity: 45 },
      updated_at: new Date().toISOString(),
    },
  },
];
