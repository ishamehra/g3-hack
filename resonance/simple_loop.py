"""Simple async biofeedback loop — same pipeline as Temporal workflow but no Temporal dependency.

Used for deployed environments (Fly.io) where running a Temporal server isn't practical.
The pipeline is identical: poll_oura → compose_state → call_gemini → upsert_supabase → update_lyria.
"""

from __future__ import annotations

import asyncio
import logging
import os

from resonance.gemini_interpreter import fallback_interpretation, interpret_state
from resonance.models import (
    BiometricData,
    CompositeState,
    GeminiInterpretation,
    SupabaseLyriaRow,
)
from resonance.oura_client import OuraClient
from resonance.state_compositor import compose_state as _compose_state
from resonance.supabase_client import upsert_lyria_params
from resonance.weather_client import get_weather

logger = logging.getLogger(__name__)


class SimpleLoop:
    """Async biofeedback loop without Temporal."""

    def __init__(self, lyria_manager):
        self._lyria_manager = lyria_manager
        self._running = False
        self._target_mood = "focused"
        self._genre_preferences: list[str] = []
        self._session_id = ""
        self._current_state: dict = {}
        self._task: asyncio.Task | None = None
        self._oura: OuraClient | None = None

    @property
    def current_state(self) -> dict:
        return self._current_state

    def update_mood(self, mood: str):
        self._target_mood = mood

    def start(self, session_id: str, target_mood: str, genre_preferences: list[str]):
        self._session_id = session_id
        self._target_mood = target_mood
        self._genre_preferences = genre_preferences
        self._running = True
        self._task = asyncio.create_task(self._run())

    def stop(self):
        self._running = False
        if self._task is not None:
            self._task.cancel()
            self._task = None

    async def _run(self):
        logger.info("SimpleLoop started for session %s", self._session_id)
        while self._running:
            try:
                await self._iterate()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("SimpleLoop iteration error: %s", e)
            await asyncio.sleep(30)
        logger.info("SimpleLoop stopped")

    async def _iterate(self):
        # 1. Poll Oura
        bio = await self._poll_oura()

        # 2. Compose state
        weather = None
        weather_key = os.environ.get("OPENWEATHER_KEY", "")
        if weather_key:
            try:
                weather = await get_weather(weather_key)
            except Exception as e:
                logger.warning("Weather fetch failed: %s", e)

        state = _compose_state(bio, weather, self._target_mood, self._genre_preferences)

        # 3. Call Gemini
        try:
            interp = await interpret_state(state)
        except Exception as e:
            logger.warning("Gemini failed (%s), using fallback", e)
            interp = fallback_interpretation(state)

        # 4. Upsert to Supabase
        if self._session_id:
            try:
                row = SupabaseLyriaRow(
                    session_id=self._session_id,
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
            except Exception as e:
                logger.warning("Supabase upsert failed: %s", e)

        # 5. Update Lyria
        if self._lyria_manager and self._lyria_manager.is_running():
            try:
                await self._lyria_manager.update_params(interp.lyria_params, interp.prompts)
                await self._lyria_manager.check_session_limit()
            except Exception as e:
                logger.warning("Lyria update failed: %s", e)

        self._current_state = interp.model_dump()
        logger.info("Loop iteration complete: mood=%s, bpm=%d", interp.lyria_params.mood_label, interp.lyria_params.bpm)

    async def _poll_oura(self) -> BiometricData:
        current_token = os.environ.get("OURA_TOKEN", "")
        if not current_token:
            logger.warning("OURA_TOKEN not set yet. Waiting for user to authenticate.")
            return BiometricData()
            
        # Recreate client if token changed (e.g. from OAuth flow)
        if self._oura is None or not hasattr(self._oura, "_token") or self._oura._token != current_token:
            self._oura = OuraClient(current_token)
            self._oura._token = current_token  # monkey patch to track it
        try:
            return await self._oura.get_current_biometrics()
        except Exception as e:
            logger.warning("Oura poll failed: %s", e)
            return BiometricData()
