from __future__ import annotations

import json
import logging

from google import genai
from google.genai import types

from resonance.models import (
    CompositeState,
    EmotionalState,
    GeminiInterpretation,
    LyriaParams,
    WeightedPrompt,
)

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are RESONANCE, an AI that translates human biometric and emotional state into music parameters.

Given a person's current state (heart rate, HRV, stress, sleep quality, readiness, weather, \
circadian phase, menstrual cycle phase, and target mood), determine:

1. Emotional coordinates: valence (0=negative, 1=positive) and arousal (0=calm, 1=excited).
   Quadrant labels: Q1 = high-valence high-arousal (happy/excited), Q2 = low-valence high-arousal \
(anxious/angry), Q3 = low-valence low-arousal (sad/depressed), Q4 = high-valence low-arousal (calm/relaxed).
2. Music parameters for Lyria RealTime generation:
   - bpm: 60-200
   - density: 0.0-1.0 (how full the mix should be)
   - brightness: 0.0-1.0 (treble / high-frequency content)
   - scale: one of C_MAJOR_A_MINOR, D_FLAT_MAJOR_B_FLAT_MINOR, D_MAJOR_B_MINOR, \
E_FLAT_MAJOR_C_MINOR, E_MAJOR_D_FLAT_MINOR, F_MAJOR_D_MINOR, G_FLAT_MAJOR_E_FLAT_MINOR, \
G_MAJOR_E_MINOR, A_FLAT_MAJOR_F_MINOR, A_MAJOR_G_FLAT_MINOR, B_FLAT_MAJOR_G_MINOR, B_MAJOR_A_FLAT_MINOR
   - guidance: 0.0-6.0 (how strictly to follow prompts)
   - temperature: 0.0-3.0 (creativity/randomness of generation)
3. A display-friendly mood_label (e.g. "Deep Focus", "Energized", "Calm Reflection").
4. A list of instruments that should be prominent (e.g. ["piano", "ambient_pad", "strings"]).
5. 2-4 weighted text prompts for music generation (weight 0.0-1.0).
6. A 1-2 sentence narration explaining your musical choices in relation to the person's state.

Key principles:
- High HR + high stress → calming music (oppose the state) UNLESS target mood is "energized".
- Low HRV → gentle, steady rhythms to support nervous system recovery.
- Menstrual phase: luteal → warmer/softer tones; ovulatory → more energy available.
- Circadian: afternoon_dip → gentle uplift; morning_peak → match high energy.
- Weather: cold/overcast → warmer sounds; sunny → brighter timbres.
- ALWAYS honour the target mood — it represents the user's intention.
- Incorporate genre preferences into prompt keywords when provided.
"""

RESPONSE_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "valence": types.Schema(type=types.Type.NUMBER),
        "arousal": types.Schema(type=types.Type.NUMBER),
        "quadrant": types.Schema(type=types.Type.STRING),
        "emotion_label": types.Schema(type=types.Type.STRING),
        "bpm": types.Schema(type=types.Type.INTEGER),
        "density": types.Schema(type=types.Type.NUMBER),
        "brightness": types.Schema(type=types.Type.NUMBER),
        "scale": types.Schema(
            type=types.Type.STRING,
            enum=[
                "C_MAJOR_A_MINOR", "D_FLAT_MAJOR_B_FLAT_MINOR",
                "D_MAJOR_B_MINOR", "E_FLAT_MAJOR_C_MINOR",
                "E_MAJOR_D_FLAT_MINOR", "F_MAJOR_D_MINOR",
                "G_FLAT_MAJOR_E_FLAT_MINOR", "G_MAJOR_E_MINOR",
                "A_FLAT_MAJOR_F_MINOR", "A_MAJOR_G_FLAT_MINOR",
                "B_FLAT_MAJOR_G_MINOR", "B_MAJOR_A_FLAT_MINOR",
            ],
        ),
        "guidance": types.Schema(type=types.Type.NUMBER),
        "temperature": types.Schema(type=types.Type.NUMBER),
        "mood_label": types.Schema(type=types.Type.STRING),
        "instruments": types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(type=types.Type.STRING),
        ),
        "prompts": types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "text": types.Schema(type=types.Type.STRING),
                    "weight": types.Schema(type=types.Type.NUMBER),
                },
                required=["text", "weight"],
            ),
        ),
        "narration": types.Schema(type=types.Type.STRING),
    },
    required=[
        "valence", "arousal", "quadrant", "emotion_label",
        "bpm", "density", "brightness", "scale", "guidance",
        "temperature", "mood_label", "instruments",
        "prompts", "narration",
    ],
)

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client()
    return _client


def _build_user_message(state: CompositeState) -> str:
    weather_str = (
        f"{state.weather.temp_f:.0f}°F, {state.weather.condition}"
        if state.weather
        else "unknown"
    )
    genres = ", ".join(state.genre_preferences) if state.genre_preferences else "any"
    return (
        f"Current state:\n"
        f"- Heart Rate: {state.biometrics.hr or 'unknown'} bpm\n"
        f"- HRV: {state.biometrics.hrv or 'unknown'} ms\n"
        f"- Stress: {state.biometrics.stress_pct or 'unknown'}\n"
        f"- Sleep Score: {state.biometrics.sleep_score or 'unknown'}\n"
        f"- Readiness: {state.biometrics.readiness_score or 'unknown'}\n"
        f"- Weather: {weather_str}\n"
        f"- Circadian Phase: {state.circadian_phase}\n"
        f"- Cycle Phase: {state.cycle_phase or 'not tracked'}\n"
        f"- Target Mood: {state.target_mood}\n"
        f"- Genre Preferences: {genres}"
    )


async def interpret_state(state: CompositeState) -> GeminiInterpretation:
    """Call Gemini Flash to interpret biometric state into music parameters."""
    client = _get_client()
    response = await client.aio.models.generate_content(
        model="gemini-2.0-flash",
        contents=_build_user_message(state),
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=RESPONSE_SCHEMA,
            temperature=0.7,
        ),
    )
    data = json.loads(response.text)
    return _parse_response(data)


def _parse_response(data: dict) -> GeminiInterpretation:
    return GeminiInterpretation(
        lyria_params=LyriaParams(
            bpm=data["bpm"],
            density=data["density"],
            brightness=data["brightness"],
            scale=data["scale"],
            guidance=data["guidance"],
            temperature=data.get("temperature", 1.1),
            mood_label=data.get("mood_label", data["emotion_label"]),
            instruments=data.get("instruments", ["piano"]),
        ),
        prompts=[
            WeightedPrompt(text=p["text"], weight=p["weight"])
            for p in data["prompts"]
        ],
        narration=data["narration"],
        emotional_state=EmotionalState(
            valence=data["valence"],
            arousal=data["arousal"],
            quadrant=data["quadrant"],
            label=data["emotion_label"],
        ),
    )


# ── Deterministic fallback (Gemini offline) ──────────────────────────

MOOD_VALENCE = {
    "focused": 0.6,
    "energized": 0.7,
    "relaxed": 0.8,
    "calm": 0.8,
    "happy": 0.9,
    "sad": 0.2,
    "anxious": 0.2,
    "sleepy": 0.5,
}


def fallback_interpretation(state: CompositeState) -> GeminiInterpretation:
    """Deterministic Russell's Circumplex mapping when Gemini is unavailable."""
    hr = state.biometrics.hr or 72
    arousal = min(1.0, max(0.0, (hr - 50) / 70))
    valence = MOOD_VALENCE.get(state.target_mood, 0.5)

    bpm = int(60 + arousal * 100)
    density = round(arousal * 0.6 + 0.2, 2)
    brightness = round(valence * 0.6 + 0.2, 2)
    scale = "C_MAJOR_A_MINOR" if valence > 0.5 else "A_FLAT_MAJOR_F_MINOR"

    if valence >= 0.5 and arousal >= 0.5:
        quadrant, label, mood_label = "Q1", "energized", "Energized"
    elif valence < 0.5 and arousal >= 0.5:
        quadrant, label, mood_label = "Q2", "tense", "Tense"
    elif valence < 0.5 and arousal < 0.5:
        quadrant, label, mood_label = "Q3", "melancholic", "Melancholic"
    else:
        quadrant, label, mood_label = "Q4", "serene", "Serene"

    return GeminiInterpretation(
        lyria_params=LyriaParams(
            bpm=bpm, density=density, brightness=brightness,
            scale=scale, guidance=3.0, temperature=1.1,
            mood_label=mood_label, instruments=["piano", "ambient_pad"],
        ),
        prompts=[WeightedPrompt(text=f"{state.target_mood} instrumental music", weight=0.8)],
        narration="Music generated from biometric data (AI offline).",
        emotional_state=EmotionalState(
            valence=valence, arousal=arousal, quadrant=quadrant, label=label,
        ),
    )
