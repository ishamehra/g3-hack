from __future__ import annotations

import logging
import os
from typing import Any, Callable, Coroutine

from temporalio import activity

from resonance.gemini_interpreter import fallback_interpretation, interpret_state
from resonance.models import (
    BiometricData,
    CompositeState,
    GeminiInterpretation,
    SupabaseLyriaRow,
    WeatherData,
)
from resonance.oura_client import OuraClient
from resonance.state_compositor import compose_state as _compose_state
from resonance.supabase_client import upsert_lyria_params
from resonance.weather_client import get_weather

logger = logging.getLogger(__name__)

# ── Module-level singletons (wired by main.py at startup) ───────────

_oura_client: OuraClient | None = None
_lyria_manager: Any = None  # LyriaManager — avoid circular import


def set_lyria_manager(manager: Any):
    global _lyria_manager
    _lyria_manager = manager


# ── Activities ───────────────────────────────────────────────────────


@activity.defn
async def poll_oura() -> dict:
    """Fetch current biometrics from Oura Ring API."""
    global _oura_client
    
    current_token = os.environ.get("OURA_TOKEN", "")
    if not current_token:
        logger.warning("OURA_TOKEN not set yet. Waiting for user to authenticate.")
        return BiometricData().model_dump()
        
    if _oura_client is None or not hasattr(_oura_client, "_token") or _oura_client._token != current_token:
        _oura_client = OuraClient(current_token)
        _oura_client._token = current_token

    try:
        bio = await _oura_client.get_current_biometrics()
    except Exception as e:
        logger.warning("Oura poll failed: %s", e)
        bio = BiometricData()
        
    return bio.model_dump()


@activity.defn
async def compose_state_activity(
    biometrics_dict: dict,
    target_mood: str,
    genre_preferences: list[str],
) -> dict:
    """Fuse biometrics + weather + circadian + cycle into a state vector."""
    biometrics = BiometricData(**biometrics_dict)
    weather_key = os.environ.get("OPENWEATHER_KEY", "")
    weather = None
    if weather_key:
        try:
            weather = await get_weather(weather_key)
        except Exception as e:
            logger.warning("Weather fetch failed: %s", e)
    state = _compose_state(biometrics, weather, target_mood, genre_preferences)
    return state.model_dump()


@activity.defn
async def call_gemini(state_dict: dict) -> dict:
    """Interpret composite state via Gemini Flash → music parameters."""
    state = CompositeState(**state_dict)
    try:
        result = await interpret_state(state)
    except Exception as e:
        logger.warning("Gemini call failed (%s), using fallback", e)
        result = fallback_interpretation(state)
    return result.model_dump()


@activity.defn
async def upsert_supabase(session_id: str, interpretation_dict: dict, state_dict: dict) -> None:
    """UPSERT the full state into lyria_params table.

    When this row changes, Supabase Realtime auto-notifies
    any frontend clients subscribed to this session.
    """
    interp = GeminiInterpretation(**interpretation_dict)
    state = CompositeState(**state_dict)

    row = SupabaseLyriaRow(
        session_id=session_id,
        weighted_prompts=[p.model_dump() for p in interp.prompts],
        bpm=interp.lyria_params.bpm,
        density=interp.lyria_params.density,
        brightness=interp.lyria_params.brightness,
        scale=interp.lyria_params.scale,
        guidance=interp.lyria_params.guidance,
        temperature=interp.lyria_params.temperature,
        mood_label=interp.lyria_params.mood_label,
        instruments=interp.lyria_params.instruments,
        narration=interp.narration,
        emotional_state=interp.emotional_state.model_dump(),
        biometrics=state.biometrics.model_dump(),
        circadian_phase=state.circadian_phase,
        cycle_phase=state.cycle_phase,
        weather=state.weather.model_dump() if state.weather else None,
    )
    await upsert_lyria_params(row)


@activity.defn
async def update_lyria(interpretation_dict: dict) -> None:
    """Push new parameters to Lyria RealTime session."""
    if _lyria_manager is None or not _lyria_manager.is_running():
        return
    assert _lyria_manager is not None
    interp = GeminiInterpretation(**interpretation_dict)
    await _lyria_manager.update_params(interp.lyria_params, interp.prompts)
    await _lyria_manager.check_session_limit()
