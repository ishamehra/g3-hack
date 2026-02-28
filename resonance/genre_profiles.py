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
