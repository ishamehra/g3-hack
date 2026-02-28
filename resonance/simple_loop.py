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
    LyriaParams,
    SupabaseLyriaRow,
)
from resonance.oura_client import OuraClient
from resonance.state_compositor import compose_state as _compose_state
from resonance.supabase_client import upsert_lyria_params
from resonance.weather_client import get_weather

logger = logging.getLogger(__name__)


class SimpleLoop:
    """Async biofeedback loop without Temporal."""

    # EMA smoothing alpha values (lower = smoother, slower response)
    _ALPHA_DEFAULT = 0.3
    _ALPHA_BPM = 0.15  # BPM changes are expensive (trigger reset_context)
    _BPM_DEAD_ZONE = 5  # Only propagate bpm if delta > this

    def __init__(self, lyria_manager):
        self._lyria_manager = lyria_manager
        self._running = False
        self._target_mood = "focused"
        self._genre_preferences: list[str] = []
        self._session_id = ""
        self._current_state: dict = {}
        self._task: asyncio.Task | None = None
        self._oura: OuraClient | None = None
        self._prev_params: LyriaParams | None = None
        self._browser_signals: dict = {}

    @property
    def current_state(self) -> dict:
        return self._current_state

    def set_browser_signals(self, signals: dict):
        self._browser_signals = signals

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

        # Merge browser signals into biometrics
        bs = self._browser_signals
        if bs:
            stress = bs.get("digital_stress", {})
            typing_cps = stress.get("typing_cps", 0)
            pause_ms = stress.get("pause_avg_ms", 500)
            # Compute digital stress score: high typing + short pauses = stressed
            if typing_cps > 0:
                bio.digital_stress_score = min(1.0, typing_cps / 8.0) * (1 - min(1.0, pause_ms / 1000))

            motion = bs.get("motion", {})
            bio.motion_intensity = motion.get("intensity")

            ambient = bs.get("ambient", {})
            bio.ambient_db = ambient.get("db")

            engagement = bs.get("engagement", {})
            idle = engagement.get("idle_seconds", 0)
            visible = engagement.get("is_visible", True)
            bio.engagement_level = 1.0 if visible and idle < 5 else (0.5 if visible else 0.0)

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

        # 5. Smooth params + update Lyria
        if self._lyria_manager and self._lyria_manager.is_running():
            try:
                smoothed = self._smooth_params(interp.lyria_params)
                await self._lyria_manager.update_params(smoothed, interp.prompts)
                await self._lyria_manager.check_session_limit()
            except Exception as e:
                logger.warning("Lyria update failed: %s", e)

        self._current_state = interp.model_dump()
        logger.info("Loop iteration complete: mood=%s, bpm=%d", interp.lyria_params.mood_label, interp.lyria_params.bpm)

    def _smooth_params(self, new: LyriaParams) -> LyriaParams:
        """EMA smoothing on numeric Lyria params to prevent jarring music jumps.

        - density, brightness, guidance, temperature: alpha=0.3
        - bpm: alpha=0.15 with dead zone (only change if delta > 5)
        - scale, mood_label, instruments: discrete, no smoothing
        """
        prev = self._prev_params
        if prev is None:
            self._prev_params = new
            return new

        a = self._ALPHA_DEFAULT

        smoothed_density = a * new.density + (1 - a) * prev.density
        smoothed_brightness = a * new.brightness + (1 - a) * prev.brightness
        smoothed_guidance = a * new.guidance + (1 - a) * prev.guidance
        smoothed_temperature = a * new.temperature + (1 - a) * prev.temperature

        # BPM: heavier smoothing + dead zone to avoid costly reset_context
        smoothed_bpm_raw = self._ALPHA_BPM * new.bpm + (1 - self._ALPHA_BPM) * prev.bpm
        if abs(smoothed_bpm_raw - prev.bpm) < self._BPM_DEAD_ZONE:
            smoothed_bpm = prev.bpm
            use_scale = prev.scale  # keep old scale too if bpm didn't change
        else:
            smoothed_bpm = round(smoothed_bpm_raw)
            use_scale = new.scale

        result = LyriaParams(
            bpm=smoothed_bpm,
            density=round(smoothed_density, 3),
            brightness=round(smoothed_brightness, 3),
            scale=use_scale,
            guidance=round(smoothed_guidance, 3),
            temperature=round(smoothed_temperature, 3),
            mood_label=new.mood_label,
            instruments=new.instruments,
        )
        self._prev_params = result
        return result

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
