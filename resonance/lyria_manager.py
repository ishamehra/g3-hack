from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncGenerator

from google import genai
from google.genai import types

from resonance.models import LyriaParams, WeightedPrompt

logger = logging.getLogger(__name__)


class LyriaManager:
    """Manages a Lyria RealTime Music WebSocket session for continuous music generation.

    Uses the correct Lyria Music API: client.aio.live.music.connect()
    with set_weighted_prompts(), set_music_generation_config(), play(), etc.
    """

    def __init__(self):
        self._client: genai.Client | None = None
        self._session = None
        self._session_ctx = None
        self._running = False
        self._current_params: LyriaParams | None = None
        self._current_prompts: list[WeightedPrompt] | None = None
        self._session_start: float | None = None

    def _get_client(self) -> genai.Client:
        if self._client is None:
            self._client = genai.Client(
                http_options=types.HttpOptions(api_version="v1alpha"),
            )
        return self._client

    async def start(self, initial_params: LyriaParams | None = None, initial_prompts: list[WeightedPrompt] | None = None):
        """Start a new Lyria RealTime Music session."""
        client = self._get_client()

        self._session_ctx = client.aio.live.music.connect(
            model="models/lyria-realtime-exp",
        )
        self._session = await self._session_ctx.__aenter__()
        self._running = True
        self._session_start = asyncio.get_event_loop().time()

        # Apply initial prompts
        prompts = initial_prompts or [WeightedPrompt(text="calm ambient instrumental music", weight=1.0)]
        await self._session.set_weighted_prompts(
            [types.WeightedPrompt(text=p.text, weight=p.weight) for p in prompts]
        )
        self._current_prompts = prompts

        # Apply initial config
        params = initial_params or LyriaParams()
        await self._apply_config(params)

        # Start playback
        await self._session.play()
        logger.info("Lyria Music session started (bpm=%d, scale=%s)", params.bpm, params.scale)

    async def _apply_config(self, params: LyriaParams):
        """Apply a MusicGenerationConfig to the active session."""
        if not self._session:
            return
        config = types.MusicGenerationConfig(
            bpm=params.bpm,
            density=params.density,
            brightness=params.brightness,
            scale=params.scale,
            guidance=params.guidance,
            temperature=params.temperature,
        )
        await self._session.set_music_generation_config(config)
        self._current_params = params

    async def receive_audio(self) -> AsyncGenerator[bytes, None]:
        """Yield raw PCM audio chunks from the Lyria Music session.

        Audio format: 16-bit PCM, 48kHz, stereo.
        """
        if not self._session:
            return
        try:
            async for msg in self._session:
                if not self._running:
                    break
                server = msg.server_content
                if server and server.audio_chunks:
                    for chunk in server.audio_chunks:
                        if chunk.data:
                            yield chunk.data
        except Exception as e:
            logger.error("Lyria receive error: %s", e)

    async def update_params(
        self,
        lyria_params: LyriaParams,
        prompts: list[WeightedPrompt],
    ):
        """Update music parameters mid-stream.

        Calls reset_context() when BPM or scale change, then applies
        new prompts and config.
        """
        if not self._session:
            return

        try:
            # Check if BPM or scale changed — need reset_context
            needs_reset = (
                self._current_params is not None
                and (
                    self._current_params.bpm != lyria_params.bpm
                    or self._current_params.scale != lyria_params.scale
                )
            )

            if needs_reset:
                await self._session.reset_context()

            # Update prompts
            await self._session.set_weighted_prompts(
                [types.WeightedPrompt(text=p.text, weight=p.weight) for p in prompts]
            )
            self._current_prompts = prompts

            # Update config
            await self._apply_config(lyria_params)

            logger.info("Lyria params updated: bpm=%d, scale=%s", lyria_params.bpm, lyria_params.scale)
        except Exception as e:
            logger.error("Lyria update error: %s", e)

    async def check_session_limit(self):
        """Reconnect before the 10-minute session limit."""
        if self._session_start is None:
            return
        elapsed = asyncio.get_event_loop().time() - self._session_start
        if elapsed > 540:  # 9 minutes
            logger.info("Approaching 10-min limit, reconnecting Lyria")
            await self._reconnect()

    async def _reconnect(self):
        """Reconnect preserving current params and prompts."""
        saved_params = self._current_params
        saved_prompts = self._current_prompts
        await self.stop()
        await asyncio.sleep(0.5)
        await self.start(initial_params=saved_params, initial_prompts=saved_prompts)

    async def stop(self):
        """Close the session."""
        self._running = False
        if self._session_ctx:
            try:
                await self._session_ctx.__aexit__(None, None, None)
            except Exception:
                pass
            self._session = None
            self._session_ctx = None
        elif self._session:
            try:
                await self._session.close()
            except Exception:
                pass
            self._session = None
        logger.info("Lyria session stopped")

    def is_running(self) -> bool:
        return self._running and self._session is not None
