from __future__ import annotations

import logging

import httpx

from resonance.models import WeatherData

logger = logging.getLogger(__name__)


async def get_weather(
    api_key: str,
    lat: float = 40.7128,
    lon: float = -74.0060,
) -> WeatherData:
    """Fetch current weather from OpenWeatherMap. Defaults to NYC."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": api_key,
                    "units": "imperial",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return WeatherData(
                temp_f=data["main"]["temp"],
                condition=data["weather"][0]["main"],
                humidity=data["main"].get("humidity"),
            )
    except Exception as e:
        logger.warning("Weather fetch failed: %s", e)
        return WeatherData()
