from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


# ── Lyria scale enum (matches Lyria RealTime API) ────────────────────

class LyriaScale(str, Enum):
    C_MAJOR_A_MINOR = "C_MAJOR_A_MINOR"
    D_FLAT_MAJOR_B_FLAT_MINOR = "D_FLAT_MAJOR_B_FLAT_MINOR"
    D_MAJOR_B_MINOR = "D_MAJOR_B_MINOR"
    E_FLAT_MAJOR_C_MINOR = "E_FLAT_MAJOR_C_MINOR"
    E_MAJOR_D_FLAT_MINOR = "E_MAJOR_D_FLAT_MINOR"
    F_MAJOR_D_MINOR = "F_MAJOR_D_MINOR"
    G_FLAT_MAJOR_E_FLAT_MINOR = "G_FLAT_MAJOR_E_FLAT_MINOR"
    G_MAJOR_E_MINOR = "G_MAJOR_E_MINOR"
    A_FLAT_MAJOR_F_MINOR = "A_FLAT_MAJOR_F_MINOR"
    A_MAJOR_G_FLAT_MINOR = "A_MAJOR_G_FLAT_MINOR"
    B_FLAT_MAJOR_G_MINOR = "B_FLAT_MAJOR_G_MINOR"
    B_MAJOR_A_FLAT_MINOR = "B_MAJOR_A_FLAT_MINOR"


# ── Core data models ─────────────────────────────────────────────────

class SessionInput(BaseModel):
    session_id: str = ""
    user_id: str = "demo"
    target_mood: str = "focused"
    genre_preferences: list[str] = []


class BiometricData(BaseModel):
    hr: int | None = None
    hrv: int | None = None
    stress_pct: float | None = None
    sleep_score: int | None = None
    readiness_score: int | None = None


class WeatherData(BaseModel):
    temp_f: float = 50.0
    condition: str = "unknown"
    humidity: int | None = None


class EmotionalState(BaseModel):
    valence: float = 0.5
    arousal: float = 0.5
    quadrant: str = "Q4"
    label: str = "neutral"


class LyriaParams(BaseModel):
    bpm: int = 80
    density: float = 0.4
    brightness: float = 0.5
    scale: str = LyriaScale.C_MAJOR_A_MINOR.value
    guidance: float = 3.0
    temperature: float = 1.1
    mood_label: str = "Neutral"
    instruments: list[str] = ["piano"]


class WeightedPrompt(BaseModel):
    text: str
    weight: float = 1.0


class GeminiInterpretation(BaseModel):
    lyria_params: LyriaParams = LyriaParams()
    prompts: list[WeightedPrompt] = []
    narration: str = ""
    emotional_state: EmotionalState = EmotionalState()


class CompositeState(BaseModel):
    biometrics: BiometricData = BiometricData()
    weather: WeatherData | None = None
    circadian_phase: str = "morning_peak"
    cycle_phase: str | None = None
    target_mood: str = "focused"
    genre_preferences: list[str] = []


# ── Supabase row model (matches lyria_params table schema) ───────────

class SupabaseLyriaRow(BaseModel):
    """Matches the lyria_params table in Supabase exactly."""
    session_id: str
    weighted_prompts: list[dict] = []
    bpm: int = 80
    density: float = 0.4
    brightness: float = 0.5
    scale: str = LyriaScale.C_MAJOR_A_MINOR.value
    guidance: float = 3.0
    temperature: float = 1.1
    mood_label: str = "Neutral"
    instruments: list[str] = ["piano"]
    narration: str = ""
    emotional_state: dict = {}
    biometrics: dict = {}
    circadian_phase: str = ""
    cycle_phase: str | None = None
    weather: dict | None = None
