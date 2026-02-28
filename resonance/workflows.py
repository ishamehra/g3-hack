from __future__ import annotations

import asyncio
from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy

from resonance.models import SessionInput


@workflow.defn
class BiofeedbackWorkflow:
    """Temporal workflow that orchestrates the 30-second biofeedback loop.

    Pipeline per iteration:
        1. poll_oura           → raw biometrics
        2. compose_state       → fused state vector
        3. call_gemini         → music params + narration
        4. upsert_supabase     → write state to lyria_params table (triggers Realtime)
        5. update_lyria        → push params to Lyria Music WebSocket
    """

    def __init__(self):
        self._running = True
        self._target_mood = "focused"
        self._genre_preferences: list[str] = []
        self._session_id = ""
        self._current_state: dict = {}

    # ── Signals (mutate workflow state) ──────────────────────────────

    @workflow.signal
    def update_mood(self, mood: str):
        self._target_mood = mood

    @workflow.signal
    def update_preferences(self, genres: list[str]):
        self._genre_preferences = genres

    @workflow.signal
    def stop(self):
        self._running = False

    # ── Queries (read-only) ──────────────────────────────────────────

    @workflow.query
    def current_state(self) -> dict:
        return self._current_state

    # ── Main loop ────────────────────────────────────────────────────

    @workflow.run
    async def run(self, input: SessionInput) -> str:
        self._target_mood = input.target_mood
        self._genre_preferences = input.genre_preferences
        self._session_id = input.session_id

        while self._running:
            # 1. Poll Oura biometrics
            biometrics = await workflow.execute_activity(
                "poll_oura",
                start_to_close_timeout=timedelta(seconds=10),
                retry_policy=RetryPolicy(maximum_attempts=3),
            )

            # 2. Compose composite state vector
            state = await workflow.execute_activity(
                "compose_state_activity",
                args=[biometrics, self._target_mood, self._genre_preferences],
                start_to_close_timeout=timedelta(seconds=5),
            )

            # 3. Call Gemini to interpret state → music params
            interpretation = await workflow.execute_activity(
                "call_gemini",
                args=[state],
                start_to_close_timeout=timedelta(seconds=15),
                retry_policy=RetryPolicy(maximum_attempts=2),
            )

            # 4. UPSERT full state to Supabase lyria_params table
            #    (triggers Realtime push to frontend)
            if self._session_id:
                await workflow.execute_activity(
                    "upsert_supabase",
                    args=[self._session_id, interpretation, state],
                    start_to_close_timeout=timedelta(seconds=5),
                    retry_policy=RetryPolicy(maximum_attempts=2),
                )

            # 5. Push new params to Lyria RealTime Music session
            await workflow.execute_activity(
                "update_lyria",
                args=[interpretation],
                start_to_close_timeout=timedelta(seconds=5),
                retry_policy=RetryPolicy(maximum_attempts=2),
            )

            self._current_state = interpretation

            # ContinueAsNew before hitting the 50K event limit
            if workflow.info().is_continue_as_new_suggested():
                workflow.continue_as_new(
                    SessionInput(
                        session_id=self._session_id,
                        user_id=input.user_id,
                        target_mood=self._target_mood,
                        genre_preferences=self._genre_preferences,
                    )
                )

            # Wait 30s, but wake immediately on stop signal
            try:
                await workflow.wait_condition(
                    lambda: not self._running,
                    timeout=timedelta(seconds=30),
                )
            except asyncio.TimeoutError:
                pass  # normal — 30s elapsed, next cycle

        return "Session ended"
