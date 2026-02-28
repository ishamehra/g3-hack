from __future__ import annotations

from datetime import date

from resonance.circadian import get_circadian_phase
from resonance.cycle import get_cycle_phase
from resonance.models import BiometricData, CompositeState, WeatherData


# ── Baseline defaults (Isha's 7-day baseline concept) ────────────────
# In production these would come from stored user history.
# For hackathon, use population-level defaults for a healthy 30yo female.

DEFAULT_BASELINES = {
    "avg_hr": 65,
    "std_hr": 5,
    "avg_hrv": 50,
    "std_hrv": 10,
}


def _normalize_z(value: float | None, avg: float, std: float) -> float:
    """Z-score normalize a value against a baseline. Returns 0 if missing."""
    if value is None or std == 0:
        return 0.0
    return (value - avg) / std


def _clamp_01(value: float) -> float:
    return max(0.0, min(1.0, value))


def normalize_biometrics(
    bio: BiometricData,
    baselines: dict | None = None,
) -> dict:
    """Normalize raw biometrics against user baselines (Isha's Stage 1).

    Returns a dict with z-score normalized values + 0-1 scaled scores.
    This enriched data gets passed to Gemini for better interpretation.
    """
    b = baselines or DEFAULT_BASELINES

    norm_hr = _normalize_z(bio.hr, b["avg_hr"], b["std_hr"])
    norm_hrv = _normalize_z(bio.hrv, b["avg_hrv"], b["std_hrv"])
    norm_sleep = _clamp_01((bio.sleep_score - 50) / 50) if bio.sleep_score is not None else 0.5
    norm_readiness = _clamp_01((bio.readiness_score - 50) / 50) if bio.readiness_score is not None else 0.5

    return {
        "norm_hr": round(norm_hr, 3),
        "norm_hrv": round(norm_hrv, 3),
        "norm_sleep": round(norm_sleep, 3),
        "norm_readiness": round(norm_readiness, 3),
    }


# Resilience level → valence bonus mapping
_RESILIENCE_BONUS = {
    "exceptional": 0.15,
    "strong": 0.1,
    "solid": 0.05,
    "adequate": 0.0,
    "limited": -0.1,
}


def infer_emotional_state(
    bio: BiometricData,
    baselines: dict | None = None,
    stress_penalty_weight: float = 0.5,
) -> dict:
    """Deterministic valence-arousal inference (Isha's Stage 2).

    - Arousal: derived from HR + HRV, filtered for physical activity
    - Valence: derived from sleep + readiness, penalized by stress/arousal
    - Activity-aware: dampens arousal when elevated HR is from exercise, not stress
    """
    norms = normalize_biometrics(bio, baselines)

    # Arousal from HR (up) and HRV (inverse)
    raw_arousal = 0.6 * norms["norm_hr"] + 0.4 * (1 - norms["norm_hrv"])

    # Activity-aware arousal: dampen if elevated HR is likely from exercise
    is_physically_active = (
        (bio.steps is not None and bio.steps > 5000)
        or (bio.active_calories is not None and bio.active_calories > 200)
    )
    if is_physically_active and raw_arousal > 0:
        raw_arousal *= 0.5  # exercise HR → halve the arousal signal

    # Browser-based signal influence
    if bio.digital_stress_score is not None:
        raw_arousal += 0.3 * bio.digital_stress_score
    if bio.motion_intensity is not None:
        raw_arousal += 0.2 * bio.motion_intensity
    if bio.engagement_level is not None and bio.engagement_level > 0.7:
        raw_arousal -= 0.1  # high engagement (focused) slightly lowers arousal

    arousal = max(-1.0, min(1.0, raw_arousal))

    # Base valence from recovery signals
    # Blend sleep_score with sleep_efficiency if available
    sleep_signal = norms["norm_sleep"]
    if bio.sleep_efficiency is not None:
        eff_norm = _clamp_01((bio.sleep_efficiency - 50) / 50)
        sleep_signal = 0.6 * sleep_signal + 0.4 * eff_norm

    base_valence = 0.5 * sleep_signal + 0.5 * norms["norm_readiness"]
    base_valence = (base_valence * 2) - 1  # map 0-1 → -1 to 1

    # Resilience bonus: strong recovery capacity boosts valence
    if bio.resilience_level:
        base_valence += _RESILIENCE_BONUS.get(bio.resilience_level, 0.0)

    # Ambient environment influence on valence
    if bio.ambient_db is not None:
        if bio.ambient_db > 70:
            base_valence -= 0.1  # very noisy environment drags valence
        elif bio.ambient_db < 30:
            base_valence += 0.05  # quiet environment slight boost

    # Stress penalty: high arousal drags valence down
    valence = base_valence - (arousal * stress_penalty_weight) if arousal > 0 else base_valence
    valence = max(-1.0, min(1.0, valence))

    # Map to 0-1 range for our models
    v01 = (valence + 1) / 2
    a01 = (arousal + 1) / 2

    if v01 >= 0.5 and a01 >= 0.5:
        quadrant, label = "Q1", "energized"
    elif v01 < 0.5 and a01 >= 0.5:
        quadrant, label = "Q2", "tense"
    elif v01 < 0.5 and a01 < 0.5:
        quadrant, label = "Q3", "melancholic"
    else:
        quadrant, label = "Q4", "serene"

    return {
        "valence": round(v01, 3),
        "arousal": round(a01, 3),
        "quadrant": quadrant,
        "label": label,
    }


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
