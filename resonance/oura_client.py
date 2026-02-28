from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone

import httpx

from resonance.models import BiometricData

logger = logging.getLogger(__name__)


class OuraClient:
    """Async client for the Oura Ring API v2."""

    def __init__(self, token: str):
        self._base_url = "https://api.ouraring.com/v2/usercollection"
        self._client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {token}"},
            timeout=10.0,
        )

    async def get_heart_rate(self) -> BiometricData:
        """Fetch latest heart rate reading (last 5-min window)."""
        now = datetime.now(timezone.utc)
        start = now - timedelta(minutes=5)
        fmt = "%Y-%m-%dT%H:%M:%S+00:00"
        try:
            resp = await self._client.get(
                f"{self._base_url}/heartrate",
                params={
                    "start_datetime": start.strftime(fmt),
                    "end_datetime": now.strftime(fmt),
                },
            )
            resp.raise_for_status()
            items = resp.json().get("data", [])
            if items:
                latest = items[-1]
                return BiometricData(hr=latest.get("bpm"))
        except Exception as e:
            logger.warning("Oura heart rate fetch failed: %s", e)
        return BiometricData()

    async def get_daily_summary(self) -> BiometricData:
        """Fetch today's sleep, stress, and readiness scores."""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        params = {"start_date": today, "end_date": today}

        async def _fetch(endpoint: str) -> dict:
            try:
                resp = await self._client.get(
                    f"{self._base_url}/{endpoint}", params=params,
                )
                resp.raise_for_status()
                items = resp.json().get("data", [])
                return items[-1] if items else {}
            except Exception as e:
                logger.warning("Oura %s fetch failed: %s", endpoint, e)
                return {}

        sleep, stress, readiness = await asyncio.gather(
            _fetch("daily_sleep"),
            _fetch("daily_stress"),
            _fetch("daily_readiness"),
        )

        return BiometricData(
            sleep_score=sleep.get("score"),
            stress_pct=stress.get("stress_high", stress.get("day_summary")),
            readiness_score=readiness.get("score"),
        )

    async def get_current_biometrics(self) -> BiometricData:
        """Combine real-time HR with daily summary scores."""
        hr_data, daily = await asyncio.gather(
            self.get_heart_rate(),
            self.get_daily_summary(),
        )
        return BiometricData(
            hr=hr_data.hr,
            hrv=hr_data.hrv,
            stress_pct=daily.stress_pct,
            sleep_score=daily.sleep_score,
            readiness_score=daily.readiness_score,
        )

    async def close(self):
        await self._client.aclose()
