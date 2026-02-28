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
        model="gemini-2.0-flash-001",
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
# Based on Isha's 4-stage interpreter pipeline with z-score normalization,
# activity-aware arousal, stress penalties, and genre personalization.

from resonance.genre_profiles import blend_genre_profiles
from resonance.state_compositor import infer_emotional_state

# Target mood → target quadrant mapping
MOOD_TARGET_QUADRANT = {
    "focused": "Q4",
    "energized": "Q1",
    "relaxed": "Q4",
    "calm": "Q4",
    "happy": "Q1",
    "sad": "Q3",
    "anxious": "Q4",  # redirect away from Q2
    "sleepy": "Q4",
    "reflective": "Q3",
    "creative": "Q1",
}

# Quadrant → default Lyria params
QUADRANT_DEFAULTS = {
    "Q1": {"bpm": 125, "density": 0.7, "brightness": 0.7, "scale": "G_MAJOR_E_MINOR", "instruments": ["bright_piano", "synth", "driving_drums"]},
    "Q2": {"bpm": 90, "density": 0.4, "brightness": 0.4, "scale": "E_FLAT_MAJOR_C_MINOR", "instruments": ["piano", "strings"]},
    "Q3": {"bpm": 70, "density": 0.3, "brightness": 0.3, "scale": "A_FLAT_MAJOR_F_MINOR", "instruments": ["solo_piano", "strings", "ambient_pad"]},
    "Q4": {"bpm": 72, "density": 0.3, "brightness": 0.35, "scale": "C_MAJOR_A_MINOR", "instruments": ["warm_piano", "soft_strings", "ambient_pad"]},
}

# Scale mapping: preferred_scale string → Lyria enum
SCALE_MAP = {
    "major": "C_MAJOR_A_MINOR",
    "minor": "A_FLAT_MAJOR_F_MINOR",
}

# Mood labels by quadrant
QUADRANT_MOOD_LABELS = {
    "Q1": "Energized",
    "Q2": "Tense",
    "Q3": "Reflective",
    "Q4": "Calm Focus",
}


def fallback_interpretation(state: CompositeState) -> GeminiInterpretation:
    """Deterministic interpreter when Gemini is unavailable.

    Implements Isha's full pipeline:
      Stage 1: Z-score normalization against baselines
      Stage 2: Activity-aware arousal + stress-penalized valence
      Stage 2.5: Genre personalization with averaging + softening
      Stage 3: Target quadrant → Lyria params with genre overrides
      Stage 4: Weighted prompt construction
    """
    # Stage 1 + 2: Infer emotional state from biometrics
    emotion = infer_emotional_state(state.biometrics)
    valence = emotion["valence"]
    arousal = emotion["arousal"]
    quadrant = emotion["quadrant"]
    label = emotion["label"]

    # Determine target quadrant from mood
    target_q = MOOD_TARGET_QUADRANT.get(state.target_mood, "Q4")
    defaults = QUADRANT_DEFAULTS.get(target_q, QUADRANT_DEFAULTS["Q4"])

    # Stage 2.5: Genre personalization
    blended = None
    if state.genre_preferences:
        blended = blend_genre_profiles(state.genre_preferences, target_q)

    # Stage 3: Build Lyria params (genre overrides > quadrant defaults)
    if blended:
        bpm = blended["bpm"]
        density = blended["density"]
        brightness = blended["brightness"]
        scale = SCALE_MAP.get(blended["preferred_scale"], defaults["scale"])
        instruments = [k.replace("_", " ") for k in blended["prompt_keywords"][:4]]
    else:
        bpm = defaults["bpm"]
        density = defaults["density"]
        brightness = defaults["brightness"]
        scale = defaults["scale"]
        instruments = defaults["instruments"]

    mood_label = QUADRANT_MOOD_LABELS.get(target_q, "Neutral")

    # Stage 4: Build weighted prompts
    prompts = [WeightedPrompt(text=f"{state.target_mood} instrumental music", weight=0.8)]
    if state.genre_preferences:
        genre_str = " and ".join(state.genre_preferences[:3])
        prompts.append(WeightedPrompt(text=f"in the style of {genre_str}", weight=0.6))

    # Narration
    hr_str = f"HR {state.biometrics.hr}bpm" if state.biometrics.hr else "HR unknown"
    phase_str = f", {state.circadian_phase.replace('_', ' ')}" if state.circadian_phase else ""
    cycle_str = f", {state.cycle_phase} phase" if state.cycle_phase else ""
    narration = f"Based on your biometrics ({hr_str}{phase_str}{cycle_str}), generating {mood_label.lower()} music. (AI offline fallback)"

    return GeminiInterpretation(
        lyria_params=LyriaParams(
            bpm=bpm, density=density, brightness=brightness,
            scale=scale, guidance=3.0, temperature=1.1,
            mood_label=mood_label, instruments=instruments,
        ),
        prompts=prompts,
        narration=narration,
        emotional_state=EmotionalState(
            valence=valence, arousal=arousal, quadrant=quadrant, label=label,
        ),
    )
