from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone

import httpx

from resonance.models import BiometricData

logger = logging.getLogger(__name__)

# Map Oura day_summary strings to a 0-100 stress percentage
_STRESS_MAP = {
    "restored": 10.0,
    "normal": 30.0,
    "stressful": 70.0,
    "high": 90.0,
}


def _secs_to_min(s: int | None) -> int | None:
    """Convert seconds to minutes, returning None if input is None."""
    return round(s / 60) if s else None


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
        """Fetch today's sleep, stress, readiness, activity, resilience, and SpO2."""
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

        sleep, stress, readiness, activity, resilience, spo2 = await asyncio.gather(
            _fetch("daily_sleep"),
            _fetch("daily_stress"),
            _fetch("daily_readiness"),
            _fetch("daily_activity"),
            _fetch("daily_resilience"),
            _fetch("daily_spo2"),
        )

        # Convert stress day_summary string to a numeric percentage
        stress_val: float | None = None
        if stress:
            summary = stress.get("day_summary")
            if isinstance(summary, str):
                stress_val = _STRESS_MAP.get(summary.lower(), 50.0)
            elif stress.get("stress_high") is not None:
                # stress_high is minutes of high stress; normalize to 0-100
                stress_val = min(100.0, (stress["stress_high"] / 60) * 100)

        return BiometricData(
            sleep_score=sleep.get("score"),
            stress_pct=stress_val,
            readiness_score=readiness.get("score"),
            steps=activity.get("steps"),
            active_calories=activity.get("active_calories"),
            resilience_level=resilience.get("level"),
            spo2_avg=spo2.get("spo2_percentage", {}).get("average"),
        )

    async def get_sleep_details(self) -> dict:
        """Fetch detailed sleep data including HRV from last night's sleep."""
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
        try:
            resp = await self._client.get(
                f"{self._base_url}/sleep",
                params={"start_date": yesterday, "end_date": today},
            )
            resp.raise_for_status()
            items = resp.json().get("data", [])
            if items:
                latest = items[-1]
                return {
                    "hrv_avg": latest.get("average_hrv"),
                    "hr_lowest": latest.get("lowest_heart_rate"),
                    "deep_sleep_seconds": latest.get("deep_sleep_duration"),
                    "rem_sleep_seconds": latest.get("rem_sleep_duration"),
                    "efficiency": latest.get("efficiency"),
                    "temp_delta": latest.get("readiness", {}).get("temperature_deviation"),
                }
        except Exception as e:
            logger.warning("Oura sleep details fetch failed: %s", e)
        return {}

    async def get_current_biometrics(self) -> BiometricData:
        """Combine real-time HR with daily summaries and detailed sleep data."""
        hr_data, daily, sleep_detail = await asyncio.gather(
            self.get_heart_rate(),
            self.get_daily_summary(),
            self.get_sleep_details(),
        )
        return BiometricData(
            hr=hr_data.hr,
            hrv=sleep_detail.get("hrv_avg"),
            stress_pct=daily.stress_pct,
            sleep_score=daily.sleep_score,
            readiness_score=daily.readiness_score,
            deep_sleep_min=_secs_to_min(sleep_detail.get("deep_sleep_seconds")),
            rem_sleep_min=_secs_to_min(sleep_detail.get("rem_sleep_seconds")),
            sleep_efficiency=sleep_detail.get("efficiency"),
            temp_delta=sleep_detail.get("temp_delta"),
            hr_lowest=sleep_detail.get("hr_lowest"),
            steps=daily.steps,
            active_calories=daily.active_calories,
            resilience_level=daily.resilience_level,
            spo2_avg=daily.spo2_avg,
        )

    async def close(self):
        await self._client.aclose()
