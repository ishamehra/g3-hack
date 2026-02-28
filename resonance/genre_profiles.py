GENRE_PROFILES: dict[str, dict] = {
    "lo-fi": {
        "bpm_range": (70, 90),
        "density": 0.3,
        "brightness": 0.3,
        "preferred_scale": "minor",
        "prompt_keywords": ["lo-fi hip hop", "warm vinyl", "mellow beats"],
    },
    "ambient": {
        "bpm_range": (60, 80),
        "density": 0.2,
        "brightness": 0.4,
        "preferred_scale": "major",
        "prompt_keywords": ["ambient pads", "atmospheric", "ethereal"],
    },
    "classical": {
        "bpm_range": (60, 120),
        "density": 0.4,
        "brightness": 0.5,
        "preferred_scale": "major",
        "prompt_keywords": ["orchestral", "classical piano", "strings"],
    },
    "jazz": {
        "bpm_range": (80, 130),
        "density": 0.5,
        "brightness": 0.5,
        "preferred_scale": "minor",
        "prompt_keywords": ["jazz piano", "smooth saxophone", "swing"],
    },
    "edm": {
        "bpm_range": (120, 150),
        "density": 0.8,
        "brightness": 0.7,
        "preferred_scale": "major",
        "prompt_keywords": ["electronic dance", "synth", "drop"],
    },
    "metal": {
        "bpm_range": (140, 200),
        "density": 0.9,
        "brightness": 0.6,
        "preferred_scale": "minor",
        "prompt_keywords": ["heavy metal", "distorted guitar", "powerful drums"],
    },
    "pop": {
        "bpm_range": (100, 130),
        "density": 0.6,
        "brightness": 0.6,
        "preferred_scale": "major",
        "prompt_keywords": ["pop melody", "catchy hooks", "upbeat"],
    },
    "r-and-b": {
        "bpm_range": (70, 100),
        "density": 0.5,
        "brightness": 0.4,
        "preferred_scale": "minor",
        "prompt_keywords": ["r&b groove", "smooth vocals", "soulful"],
    },
    "reggae": {
        "bpm_range": (70, 90),
        "density": 0.4,
        "brightness": 0.4,
        "preferred_scale": "major",
        "prompt_keywords": ["reggae rhythm", "offbeat", "island vibes"],
    },
    "folk": {
        "bpm_range": (80, 120),
        "density": 0.3,
        "brightness": 0.4,
        "preferred_scale": "major",
        "prompt_keywords": ["acoustic guitar", "folk melody", "warm"],
    },
    "hip-hop": {
        "bpm_range": (80, 110),
        "density": 0.6,
        "brightness": 0.4,
        "preferred_scale": "minor",
        "prompt_keywords": ["hip hop beat", "bass heavy", "urban"],
    },
    "indie": {
        "bpm_range": (100, 130),
        "density": 0.4,
        "brightness": 0.5,
        "preferred_scale": "major",
        "prompt_keywords": ["indie rock", "dreamy guitar", "alternative"],
    },
    "drum-and-bass": {
        "bpm_range": (160, 180),
        "density": 0.7,
        "brightness": 0.6,
        "preferred_scale": "minor",
        "prompt_keywords": ["drum and bass", "breakbeat", "fast rhythm"],
    },
    "trap": {
        "bpm_range": (130, 160),
        "density": 0.7,
        "brightness": 0.5,
        "preferred_scale": "minor",
        "prompt_keywords": ["trap beat", "808 bass", "hi-hats"],
    },
    "meditation": {
        "bpm_range": (40, 60),
        "density": 0.1,
        "brightness": 0.3,
        "preferred_scale": "major",
        "prompt_keywords": ["meditation", "singing bowls", "deep drone"],
    },
    "nature-sounds": {
        "bpm_range": (0, 60),
        "density": 0.1,
        "brightness": 0.2,
        "preferred_scale": "major",
        "prompt_keywords": ["nature ambience", "rain", "forest sounds"],
    },
}


def get_genre_profile(genre: str) -> dict | None:
    """Look up acoustic profile for a genre name."""
    return GENRE_PROFILES.get(genre)


# ── Isha's Stage 2.5: Genre personalization with averaging + softening ──

# Instrument softening transforms for calm contexts (Q4).
# Aggressive timbres get gentler equivalents.
CALM_SOFTENING = {
    "distorted guitar": "clean guitar with reverb",
    "double kick": "soft kick",
    "bass guitar": "warm bass",
    "distorted_guitar": "clean_guitar_reverb",
    "double_kick": "soft_kick",
    "bass_guitar": "warm_bass",
    "synth_lead": "soft_synth_pad",
    "sub_bass": "warm_sub_bass",
    "808_bass": "warm_808",
    "reese_bass": "soft_bass",
}


def blend_genre_profiles(
    genres: list[str],
    target_quadrant: str | None = None,
) -> dict | None:
    """Average multiple genre profiles and apply softening transforms.

    Based on Isha's Stage 2.5 personalization logic.
    Returns blended acoustic profile or None if no valid genres.
    """
    profiles = [GENRE_PROFILES[g] for g in genres if g in GENRE_PROFILES]
    if not profiles:
        return None

    # Average numeric values
    avg_bpm = int(sum(sum(p["bpm_range"]) / 2 for p in profiles) / len(profiles))
    avg_brightness = round(sum(p["brightness"] for p in profiles) / len(profiles), 2)
    avg_density = round(sum(p["density"] for p in profiles) / len(profiles), 2)

    # Mode: minor wins if any genre is minor
    scales = [p["preferred_scale"] for p in profiles]
    if "minor" in scales:
        preferred_scale = "minor"
    else:
        preferred_scale = "major"

    # Merge all prompt keywords
    keywords = []
    for p in profiles:
        keywords.extend(p["prompt_keywords"])

    # Apply softening transforms for calm target (Q4)
    if target_quadrant == "Q4":
        keywords = [CALM_SOFTENING.get(k, k) for k in keywords]

    return {
        "bpm": avg_bpm,
        "density": avg_density,
        "brightness": avg_brightness,
        "preferred_scale": preferred_scale,
        "prompt_keywords": list(dict.fromkeys(keywords)),  # deduplicate, preserve order
    }
