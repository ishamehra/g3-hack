import json
from typing import Dict, Any, List, TypedDict, cast

# --- Constants ---
class AcousticProfile(TypedDict):
    tempo: List[int]
    mode: str
    brightness: float
    density: float
    instruments: List[str]

# Stage 2.5: Genre -> Acoustic Feature Lookup Table
GENRE_ACOUSTIC_PROFILES: Dict[str, AcousticProfile] = {
  "ambient":    { "tempo": [60, 80],   "mode": "mixed",  "brightness": 0.2, "density": 0.1, "instruments": ["synth_pad", "field_recording", "drone"] },
  "lo-fi":      { "tempo": [70, 90],   "mode": "major",  "brightness": 0.3, "density": 0.3, "instruments": ["muted_piano", "vinyl_crackle", "soft_drums"] },
  "classical":  { "tempo": [60, 100],  "mode": "mixed",  "brightness": 0.4, "density": 0.4, "instruments": ["piano", "strings", "woodwinds"] },
  "jazz":       { "tempo": [80, 130],  "mode": "mixed",  "brightness": 0.5, "density": 0.5, "instruments": ["piano", "upright_bass", "brushed_drums", "saxophone"] },
  "acoustic":   { "tempo": [70, 110],  "mode": "major",  "brightness": 0.4, "density": 0.3, "instruments": ["acoustic_guitar", "light_percussion", "cello"] },
  "metal":      { "tempo": [120, 180], "mode": "minor",  "brightness": 0.9, "density": 0.9, "instruments": ["distorted_guitar", "double_kick", "bass_guitar"] },
  "edm":        { "tempo": [125, 150], "mode": "major",  "brightness": 0.8, "density": 0.8, "instruments": ["synth_lead", "sub_bass", "four_on_floor_kick"] },
  "hip-hop":    { "tempo": [80, 110],  "mode": "minor",  "brightness": 0.5, "density": 0.6, "instruments": ["808_bass", "hi_hats", "sampled_keys"] },
  "post-rock":  { "tempo": [80, 130],  "mode": "minor",  "brightness": 0.5, "density": 0.4, "instruments": ["reverb_guitar", "delay_guitar", "crescendo_drums"] },
  "shoegaze":   { "tempo": [80, 120],  "mode": "minor",  "brightness": 0.3, "density": 0.7, "instruments": ["distorted_reverb_guitar", "ethereal_vocals", "wash_drums"] },
  "folk":       { "tempo": [80, 120],  "mode": "major",  "brightness": 0.4, "density": 0.3, "instruments": ["acoustic_guitar", "fiddle", "mandolin", "harmonica"] },
  "indie":      { "tempo": [90, 130],  "mode": "mixed",  "brightness": 0.5, "density": 0.5, "instruments": ["jangly_guitar", "synth", "organic_drums"] },
  "r&b":        { "tempo": [70, 100],  "mode": "minor",  "brightness": 0.4, "density": 0.5, "instruments": ["keys", "smooth_bass", "soft_drums"] },
  "soundtrack": { "tempo": [60, 130],  "mode": "mixed",  "brightness": 0.5, "density": 0.5, "instruments": ["full_orchestra", "piano", "choir"] },
  "techno":     { "tempo": [125, 140], "mode": "minor",  "brightness": 0.6, "density": 0.7, "instruments": ["analog_synth", "kick_drum", "hi_hat_pattern"] },
  "drum_and_bass": { "tempo": [160, 180], "mode": "minor", "brightness": 0.7, "density": 0.8, "instruments": ["reese_bass", "breakbeat", "synth_stab"] }
}

# --- Stage 1 ---
def stage1_sense(raw_data: Dict[str, Any], baseline_data: Dict[str, Any]) -> Dict[str, Any]:
    print("\n--- STAGE 1: SENSE (Data Acquisition & Normalization) ---")
    
    current_hr = raw_data.get("hr", 75)
    current_hrv = raw_data.get("hrv", 40)
    
    avg_hr = baseline_data.get("avg_hr", 70)
    std_hr = baseline_data.get("std_hr", 5)
    
    avg_hrv = baseline_data.get("avg_hrv", 50)
    std_hrv = baseline_data.get("std_hrv", 10)
    
    norm_hr = (current_hr - avg_hr) / std_hr if std_hr != 0 else 0
    norm_hrv = (current_hrv - avg_hrv) / std_hrv if std_hrv != 0 else 0
    
    def normalize_0_1(val, min_val, max_val):
        return max(0.0, min(1.0, (val - min_val) / (max_val - min_val)))
    
    norm_sleep = normalize_0_1(raw_data.get("sleep_score", 70), 50, 100)
    norm_readiness = normalize_0_1(raw_data.get("readiness_score", 70), 50, 100)
    
    normalized = {
        "norm_hr": norm_hr,
        "norm_hrv": norm_hrv,
        "norm_sleep": norm_sleep,
        "norm_readiness": norm_readiness,
        "activity_class": raw_data.get("activity_class", 1)
    }
    print(f"Normalized Biometrics:\n{json.dumps(normalized, indent=2)}")
    return normalized

# --- Stage 2 ---
def stage2_infer(norm_data: Dict[str, Any], stress_penalty_weight: float = 0.5) -> Dict[str, Any]:
    print("\n--- STAGE 2: INFER (Physiological -> Emotional State) ---")
    # Base Valence inference
    base_valence = 0.5 * norm_data["norm_sleep"] + 0.5 * norm_data["norm_readiness"]
    # Map 0-1 to -1 to 1 for the circumplex scale
    base_valence = (base_valence * 2) - 1
    
    # Dynamic Arousal inference
    raw_arousal = 0.6 * norm_data["norm_hr"] + 0.4 * (1 - norm_data["norm_hrv"])
    
    # Filter physical activity
    if norm_data["activity_class"] > 2:
        arousal = 0 # Physical exertion, not psychological
    else:
        arousal = raw_arousal
        
    arousal = max(-1.0, min(1.0, arousal)) # clamp between -1 and 1
        
    # Final Valence
    current_valence = base_valence - (arousal * stress_penalty_weight) if arousal > 0 else base_valence
    current_valence = max(-1.0, min(1.0, current_valence))
    
    # Quadrant Assignment
    quadrant = "Unknown"
    if current_valence > 0 and arousal > 0: quadrant = "Q1" # Excited
    elif current_valence < 0 and arousal > 0: quadrant = "Q2" # Stressed
    elif current_valence < 0 and arousal <= 0: quadrant = "Q3" # Reflective/Sad
    elif current_valence > 0 and arousal <= 0: quadrant = "Q4" # Calm
    
    state = {
        "valence": round(float(current_valence), 2),  # type: ignore
        "arousal": round(float(arousal), 2),  # type: ignore
        "quadrant": quadrant,
        "label": "Stressed/Anxious" if quadrant == "Q2" else "Calm/Serene" if quadrant == "Q4" else "Active"
    }
    print(f"Inferred Emotional State:\n{json.dumps(state, indent=2)}")
    return state

# --- Stage 2.5 ---
def stage2_5_personalize(target_quadrant: str, user_prefs: Dict[str, Any]) -> Dict[str, Any]:
    print("\n--- STAGE 2.5: PERSONALIZE (User Preference Layer) ---")
    
    target_genres = cast(List[str], user_prefs.get(target_quadrant, []))
    if not target_genres:
        print(f"No preferences found for {target_quadrant}, will fall back to defaults in Stage 3.")
        return {} 
        
    print(f"Found preferences for {target_quadrant}: {target_genres}")
    profiles = [GENRE_ACOUSTIC_PROFILES[g] for g in target_genres if g in GENRE_ACOUSTIC_PROFILES]
    
    if not profiles:
        return {}
        
    # Average the numeric values
    avg_tempo = sum([sum(p["tempo"])/2 for p in profiles]) / len(profiles)
    avg_brightness = sum([p["brightness"] for p in profiles]) / len(profiles)
    avg_density = sum([p["density"] for p in profiles]) / len(profiles)
    
    modes = [p["mode"] for p in profiles]
    if "minor" in modes:
        final_mode = "minor"
    elif "major" in modes and "mixed" not in modes:
        final_mode = "major"
    else:
        final_mode = "mixed"
        
    # Merge instruments and apply soft transforms
    instruments = []
    for p in profiles:
        instruments.extend(p["instruments"])
        
    # Softening transform specifically for Q4 (Calm)
    if target_quadrant == "Q4":
        instruments = [i.replace("distorted_guitar", "distorted_guitar_clean_reverb") for i in instruments]
        instruments = [i.replace("double_kick", "soft_kick") for i in instruments]
        instruments = [i.replace("bass_guitar", "warm_bass") for i in instruments]

    instruments = list(set(instruments)) # Deduplicate

    averaged = {
        "tempo_bpm": int(avg_tempo),
        "brightness": round(float(avg_brightness), 2),  # type: ignore
        "rhythmic_density": round(float(avg_density), 2),  # type: ignore
        "mode": final_mode,
        "instrumentation": instruments
    }
    
    print(f"Personalized Acoustic Base Profile:\n{json.dumps(averaged, indent=2)}")
    return averaged

# --- Stage 3 ---
def stage3_decide(current_state: Dict[str, Any], target_state: Dict[str, Any], personalized_profile: Dict[str, Any]) -> Dict[str, Any]:
    print("\n--- STAGE 3: DECIDE (State -> Target -> Musical Params) ---")
    
    delta_valence = target_state["valence"] - current_state["valence"]
    delta_arousal = target_state["arousal"] - current_state["arousal"]
    
    print(f"Emotional Delta -> Valence: {delta_valence:.2f}, Arousal: {delta_arousal:.2f}")
    
    params = {}
    
    # Defaults in case no personalized profile is present
    defaults = {
        "Q1": {"tempo_bpm": 130, "mode": "major", "brightness": 0.8, "rhythmic_density": 0.8, "instrumentation": ["bright_piano", "acoustic_guitar", "major_synths"]},
        "Q3": {"tempo_bpm": 70,  "mode": "minor", "brightness": 0.3, "rhythmic_density": 0.3, "instrumentation": ["solo_piano", "strings", "ambient_pads"]},
        "Q4": {"tempo_bpm": 68,  "mode": "major", "brightness": 0.2, "rhythmic_density": 0.2, "instrumentation": ["warm_piano", "soft_strings", "ambient_pad"]},
    }
    
    target_q = target_state.get("quadrant", "Q4")
    q_defaults = defaults.get(target_q, defaults["Q4"])
    
    params["tempo_bpm"] = personalized_profile.get("tempo_bpm", q_defaults["tempo_bpm"])
    params["mode"] = personalized_profile.get("mode", q_defaults["mode"])
    params["brightness"] = personalized_profile.get("brightness", q_defaults["brightness"])
    params["rhythmic_density"] = personalized_profile.get("rhythmic_density", q_defaults["rhythmic_density"])
    params["instrumentation"] = personalized_profile.get("instrumentation", q_defaults["instrumentation"])
    
    params["key"] = "C" if params["mode"] == "major" else "A"
    
    params["dynamic_range"] = 0.8 if abs(delta_arousal) > 0.5 else 0.4
    params["bridging"] = True if abs(delta_arousal) > 0.3 or abs(delta_valence) > 0.3 else False
    params["duration_seconds"] = 300
    
    print(f"Final Music Params Vector:\n{json.dumps(params, indent=2)}")
    return params

# --- Stage 4 ---
def stage4_compose(params: dict, user_prefs: dict, target_q: str) -> str:
    print("\n--- STAGE 4: COMPOSE (Musical Params -> Generated Prompt) ---")
    
    tempo_desc = "slow and gentle" if params["tempo_bpm"] < 80 else \
                 "moderate" if params["tempo_bpm"] < 110 else \
                 "upbeat and driving"

    mode_desc = "major key, warm and uplifting" if params["mode"] == "major" else \
                "minor key, introspective and emotional" if params["mode"] == "minor" else \
                "mixed mode, balanced and reflective"

    instruments = ", ".join(params["instrumentation"]).replace("_", " ")

    brightness_desc = "soft, warm tones" if params["brightness"] < 0.4 else \
                      "balanced tones" if params["brightness"] < 0.7 else \
                      "bright, crisp tones"

    density_desc = "sparse, spacious arrangement" if params["rhythmic_density"] < 0.3 else \
                   "moderately layered" if params["rhythmic_density"] < 0.6 else \
                   "rich, densely layered"

    # Personalization injection (genre style language for the prompt)
    target_genres = user_prefs.get(target_q, [])
    genre_clause = ""
    if target_genres:
        genre_names = " and ".join(target_genres[:3])
        genre_clause = f"in the style of {genre_names}, "

    prompt = (
        f"Compose a {tempo_desc} instrumental piece {genre_clause}at approximately "
        f"{params['tempo_bpm']} BPM in {params['key']} {params['mode']}. "
        f"Use {instruments} with {brightness_desc}. "
        f"The arrangement should be {density_desc} with a "
        f"{'wide' if params['dynamic_range'] > 0.6 else 'consistent'} dynamic range. "
        f"The mood should {'gradually transition from tense to peaceful' if params['bridging'] else 'maintain a steady emotional tone'}. "
        f"Duration: approximately {params['duration_seconds'] // 60} minutes."
    )
    
    print(f"GENERATED PROMPT FOR LYRIA 2 / MUSICGEN:\n> \"{prompt}\"")
    return prompt

# --- Main Driver ---
def run_pipeline():
    print("=== RESONANCE: PIPELINE INTERPRETER START ===")
    
    # 1. SENSE
    # Mock data modeling a highly stressed user
    raw_bio = {
        "hr": 95,            # High HR
        "hrv": 15,           # Low HRV
        "sleep_score": 60,   # Poor sleep impacts base valence
        "readiness_score": 55, 
        "activity_class": 1  # Not moving, so high HR is psychological stress
    }
    
    # Mock baselines from past 7 days
    baseline_bio = {
        "avg_hr": 65,
        "std_hr": 5,
        "avg_hrv": 50,
        "std_hrv": 10
    }
    
    norm_data = stage1_sense(raw_bio, baseline_bio)
    
    # 2. INFER
    current_state = stage2_infer(norm_data)
    
    # (Context) - System defines user is stressed, user requests to feel Calm.
    target_state: Dict[str, Any] = {
        "valence": 0.80,
        "arousal": -0.25,
        "quadrant": "Q4",
        "label": "Calm/Serene"
    }
    print(f"\nUser Target Selected: {target_state['label']} ({target_state['quadrant']})")
    
    # 2.5 PERSONALIZE
    # User's mapped preferences from their onboarding profile
    user_preferences = {
        "Q4": ["metal", "ambient"]  # The example from the document
    }
    
    personalized_profile = stage2_5_personalize(str(target_state['quadrant']), user_preferences)
    
    # 3. DECIDE
    music_params = stage3_decide(current_state, target_state, personalized_profile)
    
    # 4. COMPOSE
    prompt = stage4_compose(music_params, user_preferences, str(target_state['quadrant']))
    
    print("\n=== PIPELINE COMPLETE ===")

if __name__ == "__main__":
    run_pipeline()
