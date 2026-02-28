from datetime import date


def get_cycle_phase(
    last_period_start: date | None,
    cycle_length: int = 28,
) -> str | None:
    """Calculate menstrual cycle phase from last period start date."""
    if last_period_start is None:
        return None

    days = (date.today() - last_period_start).days % cycle_length
    # Scale boundaries proportionally to cycle length
    ratio = cycle_length / 28

    if days < int(5 * ratio):
        return "menstrual"
    elif days < int(13 * ratio):
        return "follicular"
    elif days < int(16 * ratio):
        return "ovulatory"
    else:
        return "luteal"
