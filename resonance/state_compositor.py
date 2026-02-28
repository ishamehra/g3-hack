from __future__ import annotations

from datetime import date

from resonance.circadian import get_circadian_phase
from resonance.cycle import get_cycle_phase
from resonance.models import BiometricData, CompositeState, WeatherData


def compose_state(
    biometrics: BiometricData,
    weather: WeatherData | None,
    target_mood: str,
    genre_preferences: list[str],
    last_period_start: date | None = None,
    cycle_length: int = 28,
) -> CompositeState:
    """Fuse all signals into a single composite state vector."""
    return CompositeState(
        biometrics=biometrics,
        weather=weather,
        circadian_phase=get_circadian_phase(),
        cycle_phase=get_cycle_phase(last_period_start, cycle_length),
        target_mood=target_mood,
        genre_preferences=genre_preferences,
    )
