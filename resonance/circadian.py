from datetime import datetime


def get_circadian_phase(hour: int | None = None) -> str:
    """Map current hour to a circadian phase string."""
    if hour is None:
        hour = datetime.now().hour

    if 6 <= hour < 9:
        return "morning_rise"
    elif 9 <= hour < 12:
        return "morning_peak"
    elif 12 <= hour < 14:
        return "afternoon_dip"
    elif 14 <= hour < 17:
        return "afternoon_recovery"
    elif 17 <= hour < 20:
        return "evening_wind_down"
    elif 20 <= hour < 23:
        return "night_relaxation"
    else:
        return "sleep"
