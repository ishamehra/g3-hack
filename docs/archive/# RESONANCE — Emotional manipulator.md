# RESONANCE — Closed-Loop Emotional Regulation via Wearable Biometrics & Generative Music

## Hackathon Proposal

---

## 1. One-Liner

A system that reads your physiological state from a wearable, infers your emotional quadrant, and generates original music in real-time to guide you toward a target mood.

---

## 2. Core Thesis

Emotions produce measurable physiological signatures. Music reliably shifts those signatures. If we close the loop between sensing and generation, we give the user direct, intentional control over their emotional state — no drugs, no therapy session, just sound shaped by data.

---

## 3. The Pipeline (Sequential)

The entire system is a linear pipeline with one feedback arc. Every stage has a defined input, transformation, and output.

```
┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ STAGE 1  │─▶│ STAGE 2  │─▶│ STAGE 2.5    │─▶│ STAGE 3  │─▶│ STAGE 4  │─▶│ STAGE 5  │
│ SENSE    │  │ INFER    │  │ PERSONALIZE  │  │ DECIDE   │  │ COMPOSE  │  │ DELIVER  │
│(Wearable)│  │(Mood Map)│  │(User Prefs)  │  │(Target Δ)│  │(Generate)│  │(Playback)│
└──────────┘  └──────────┘  └──────┬───────┘  └──────────┘  └──────────┘  └────┬─────┘
                                   ▲                                            │
                             [Onboarding]                      feedback loop ◀──┘
```

---

## 4. Stage Breakdown

### STAGE 1 — SENSE (Physiological Data Acquisition)

**Input:** Raw biometric stream from wearable
**Output:** Normalized physiological feature vector

#### What We're Capturing

| Signal | What It Tells Us | Source |
|---|---|---|
| Heart Rate Variability (HRV) | Autonomic balance — parasympathetic vs sympathetic dominance | Oura Ring API |
| Resting Heart Rate (RHR) | Baseline arousal level | Oura Ring API |
| Skin Temperature Delta | Stress/relaxation trend (peripheral vasoconstriction) | Oura Ring API |
| Heart Rate (live) | Real-time arousal | Apple Watch / Garmin (stretch goal) |

#### Tools & APIs

- **Oura Ring API v2** — OAuth2 REST API, returns JSON. Provides HRV (`hrv_summary`), heart rate, skin temp, sleep stages. Polling interval: ~5 min batches (not real-time).
  - Docs: `https://cloud.ouraring.com/v2/docs`
  - Auth: OAuth2 Personal Access Token (fastest for hackathon)
  - Key endpoints: `/v2/usercollection/heartrate`, `/v2/usercollection/daily_stress`
- **Fallback/Enhancement — Apple HealthKit** (if team has Apple Watch): Provides inter-beat interval (IBI) data for real-time HRV calculation.
- **Data format:** All signals normalized to 0–1 scale relative to user's personal 7-day baseline (Oura provides this context via `daily_readiness`).

#### Hackathon Shortcut

For demo purposes, if live Oura polling is too slow (5-min batches), we can:
1. Pull the user's last 24h of Oura data on app load.
2. Use the most recent readiness/stress score as the "current state" seed.
3. Simulate real-time updates with interpolated values for the demo.

#### Output Schema

```json
{
  "timestamp": "2026-02-28T14:30:00Z",
  "hrv_ms": 42,
  "rhr_bpm": 68,
  "skin_temp_delta_c": -0.3,
  "stress_score": 72,
  "normalized": {
    "arousal": 0.73,
    "autonomic_balance": 0.35
  }
}
```

---

### STAGE 2 — INFER (Physiological → Emotional State)

**Input:** Normalized physiological feature vector
**Output:** Position on the Valence-Arousal circumplex model

#### The Model: Russell's Circumplex

We map physiological signals onto the two-axis emotion model:

```
                    HIGH AROUSAL
                        │
          Q2            │           Q1
     Stressed/Angry     │     Excited/Euphoric
     (low V, high A)    │     (high V, high A)
                        │
   ─────────────────────┼─────────────────────
     LOW VALENCE        │        HIGH VALENCE
                        │
          Q3            │           Q4
     Sad/Depressed      │     Calm/Serene
     (low V, low A)     │     (high V, low A)
                        │
                    LOW AROUSAL
```

#### Mapping Rules (The Hackathon "Heuristic" Model)

This is a deterministic converter that simulates the behavior of complex ML models using Oura's specific API endpoints, entirely avoiding the cold-start training problem.

**Step 1: Z-Score Normalization**
First, normalize the user's current data against their own historical averages.
```
norm_hr = (current_hr - avg_hr) / std_hr
norm_hrv = (current_hrv - avg_hrv) / std_hrv
```

**Step 2: Base Valence (The "Mood" Baseline)**
Infer the user's underlying emotional resilience for the day using their slow-moving recovery metrics.
```
# Higher sleep/readiness = higher valence baseline (more resilient to stress)
base_valence = 0.5 * norm(sleep_score) + 0.5 * norm(readiness_score)
```

**Step 3: Dynamic Arousal (The Real-Time Spike)**
Calculate real-time arousal using HR and HRV, but critically, filter out physical activity.
```
raw_arousal = 0.6 * norm_hr + 0.4 * (1 - norm_hrv)

if oura_activity_class > 2:
    # Heart rate spike is physical exertion, not emotional.
    arousal = 0
else:
    # User is mostly still, so HR spike is psychological.
    arousal = raw_arousal
```

**Step 4: Final Quadrant Mapping**
```
# High arousal penalizes valence (stress), unless base is exceptionally high
current_valence = base_valence - (arousal * stress_penalty_weight)

if current_valence > 0 and arousal > 0: quadrant = "Q1" (Excited)
if current_valence < 0 and arousal > 0: quadrant = "Q2" (Stressed)
if current_valence < 0 and arousal < 0: quadrant = "Q3" (Reflective/Sad)
if current_valence > 0 and arousal < 0: quadrant = "Q4" (Calm)
```

#### Software

- **Language:** Python (FastAPI backend) or Node.js (if keeping full-stack JS)
- **No external ML library needed** — this is arithmetic on normalized values
- **Library:** `numpy` for vectorization if Python; plain math if Node

#### Output Schema

```json
{
  "current_state": {
    "valence": 0.32,
    "arousal": 0.73,
    "quadrant": "Q2",
    "label": "stressed/anxious"
  }
}
```

---

### STAGE 2.5 — PERSONALIZE (User Preference Layer)

**Input:** User-defined genre-mood mappings
**Output:** Personalized acoustic profile overrides for Stage 3

#### Why This Exists

Population-level research says "slow tempo + major key → calm." But if you grew up on metal, a 140 BPM breakdown might be your flow state. If lo-fi bores you, it won't calm you — it'll frustrate you. The system is useless without knowing what *your* musical comfort zones are per emotional target.

#### Preference Collection (Onboarding Flow)

On first launch, the user completes a preference mapping. This is **not** a long survey — it's a single interactive screen.

**UI: Preference Mapper**
```
┌──────────────────────────────────────────────┐
│  What music fits each mood for YOU?           │
│                                               │
│  When I want to feel CALM, I reach for:       │
│  ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────┐ │
│  │Classical│ │ Lo-fi  │ │Acoustic │ │ Jazz │ │
│  └────────┘ └────────┘ └─────────┘ └──────┘ │
│  ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────┐ │
│  │Ambient │ │  R&B   │ │  Other: │ │______│ │
│  └────────┘ └────────┘ └─────────┘ └──────┘ │
│                                               │
│  When I want to feel ENERGIZED, I reach for:  │
│  ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────┐ │
│  │Hip-Hop │ │  EDM   │ │  Rock   │ │ Pop  │ │
│  └────────┘ └────────┘ └─────────┘ └──────┘ │
│  ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────┐ │
│  │  Metal │ │ Punk   │ │  Other: │ │______│ │
│  └────────┘ └────────┘ └─────────┘ └──────┘ │
│                                               │
│  When I want to feel FOCUSED, I reach for:    │
│  ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────┐ │
│  │Lo-fi   │ │  Post- │ │Soundtrack│ │Techno│ │
│  │        │ │  Rock  │ │         │ │      │ │
│  └────────┘ └────────┘ └─────────┘ └──────┘ │
│  ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────┐ │
│  │ Jazz   │ │Classcl │ │  Other: │ │______│ │
│  └────────┘ └────────┘ └─────────┘ └──────┘ │
│                                               │
│  When I want to feel REFLECTIVE, I reach for: │
│  ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────┐ │
│  │  Indie │ │  Folk  │ │  Blues  │ │ Soul │ │
│  └────────┘ └────────┘ └─────────┘ └──────┘ │
│  ┌────────┐ ┌────────┐ ┌─────────┐ ┌──────┐ │
│  │Shoegaze│ │ Emo    │ │  Other: │ │______│ │
│  └────────┘ └────────┘ └─────────┘ └──────┘ │
│                                               │
│                          [Save Preferences →] │
└──────────────────────────────────────────────┘
```

The four mood targets map directly to the circumplex quadrants:
- **Calm** → Q4 (high valence, low arousal)
- **Energized** → Q1 (high valence, high arousal)
- **Focused** → Between Q1 and Q4 (moderate valence, moderate arousal)
- **Reflective** → Q3 (low valence, low arousal)

User can select **multiple genres per mood** (multi-select). The "Other" field accepts free text for niche genres.

#### Preference Storage Schema

```json
{
  "user_id": "usr_abc123",
  "created_at": "2026-02-28T10:00:00Z",
  "preferences": {
    "Q4_calm": {
      "genres": ["ambient", "acoustic", "jazz"],
      "custom": null
    },
    "Q1_energized": {
      "genres": ["metal", "edm"],
      "custom": "drum and bass"
    },
    "Q1Q4_focused": {
      "genres": ["lo-fi", "post-rock", "soundtrack"],
      "custom": null
    },
    "Q3_reflective": {
      "genres": ["shoegaze", "folk", "indie"],
      "custom": null
    }
  }
}
```

#### Genre → Acoustic Feature Lookup Table

Each genre carries implicit acoustic defaults. These override the population-level mappings in Stage 3.

```
GENRE_ACOUSTIC_PROFILES = {
  "ambient":    { tempo: [60, 80],   mode: "mixed",  brightness: 0.2, density: 0.1, instruments: ["synth_pad", "field_recording", "drone"] },
  "lo-fi":      { tempo: [70, 90],   mode: "major",  brightness: 0.3, density: 0.3, instruments: ["muted_piano", "vinyl_crackle", "soft_drums"] },
  "classical":  { tempo: [60, 100],  mode: "mixed",  brightness: 0.4, density: 0.4, instruments: ["piano", "strings", "woodwinds"] },
  "jazz":       { tempo: [80, 130],  mode: "mixed",  brightness: 0.5, density: 0.5, instruments: ["piano", "upright_bass", "brushed_drums", "saxophone"] },
  "acoustic":   { tempo: [70, 110],  mode: "major",  brightness: 0.4, density: 0.3, instruments: ["acoustic_guitar", "light_percussion", "cello"] },
  "metal":      { tempo: [120, 180], mode: "minor",  brightness: 0.9, density: 0.9, instruments: ["distorted_guitar", "double_kick", "bass_guitar"] },
  "edm":        { tempo: [125, 150], mode: "major",  brightness: 0.8, density: 0.8, instruments: ["synth_lead", "sub_bass", "four_on_floor_kick"] },
  "hip-hop":    { tempo: [80, 110],  mode: "minor",  brightness: 0.5, density: 0.6, instruments: ["808_bass", "hi_hats", "sampled_keys"] },
  "post-rock":  { tempo: [80, 130],  mode: "minor",  brightness: 0.5, density: 0.4, instruments: ["reverb_guitar", "delay_guitar", "crescendo_drums"] },
  "shoegaze":   { tempo: [80, 120],  mode: "minor",  brightness: 0.3, density: 0.7, instruments: ["distorted_reverb_guitar", "ethereal_vocals", "wash_drums"] },
  "folk":       { tempo: [80, 120],  mode: "major",  brightness: 0.4, density: 0.3, instruments: ["acoustic_guitar", "fiddle", "mandolin", "harmonica"] },
  "indie":      { tempo: [90, 130],  mode: "mixed",  brightness: 0.5, density: 0.5, instruments: ["jangly_guitar", "synth", "organic_drums"] },
  "r&b":        { tempo: [70, 100],  mode: "minor",  brightness: 0.4, density: 0.5, instruments: ["keys", "smooth_bass", "soft_drums"] },
  "soundtrack": { tempo: [60, 130],  mode: "mixed",  brightness: 0.5, density: 0.5, instruments: ["full_orchestra", "piano", "choir"] },
  "techno":     { tempo: [125, 140], mode: "minor",  brightness: 0.6, density: 0.7, instruments: ["analog_synth", "kick_drum", "hi_hat_pattern"] },
  "drum_and_bass": { tempo: [160, 180], mode: "minor", brightness: 0.7, density: 0.8, instruments: ["reese_bass", "breakbeat", "synth_stab"] }
}
```

#### How Preferences Modify Stage 3

The preference layer sits as a **filter** on top of Stage 3's output. The flow becomes:

```
1. Stage 3 computes target quadrant + emotional delta
2. System fetches user preferences for target quadrant
3. If user has preferences for this quadrant:
     → Pull acoustic profiles for user's selected genres
     → AVERAGE the profiles (if multiple genres selected)
     → Use averaged profile as the acoustic base
     → Stage 3's delta logic still controls bridging curve and tempo gradient
4. If no preferences set for this quadrant:
     → Fall back to population-level defaults (original Stage 3 behavior)
```

**Example Resolution:**

User is in Q2 (stressed), targets Q4 (calm). User's Q4 preferences are `["metal", "ambient"]`.

```
metal_calm   = { tempo: 120, brightness: 0.9, density: 0.9, mode: "minor" }
ambient_calm = { tempo: 70,  brightness: 0.2, density: 0.1, mode: "mixed" }

averaged = {
  tempo: 95,
  brightness: 0.55,
  density: 0.50,
  mode: "minor",    // minor wins if either genre is minor
  instruments: merge(["distorted_guitar", "double_kick"], ["synth_pad", "drone"])
              → ["synth_pad", "distorted_guitar_clean_reverb", "drone", "soft_kick"]
}
```

Note: the instrument merge isn't naive concatenation. For conflicting timbres (distorted guitar in a calm context), the system applies a **softening transform** — distorted guitar becomes clean guitar with heavy reverb, double kick becomes soft kick. This is encoded in the prompt constructor (Stage 4) as style modifiers.

#### Preference Update

Users can update preferences at any time via a settings screen. Preferences persist in localStorage (hackathon) or a lightweight DB (Supabase/Firebase if time allows).

Additionally, the feedback loop (Stage 5) can **learn** preferences over time as a stretch goal:

```
IF user reached target state AND music was playing:
  → Reinforce: increase weight of genres used in that session for that quadrant
IF user did NOT reach target state:
  → Attenuate: decrease weight, surface "try different genres?" prompt next session
```

#### Preference API Route

```
GET  /api/preferences          → Fetch current user preferences
POST /api/preferences          → Save/update preferences (from onboarding)
GET  /api/preferences/:quadrant → Fetch acoustic profile for specific target quadrant
```

#### Updated Pipeline Diagram

```
┌──────────┐   ┌──────────┐   ┌──────────────┐   ┌──────────┐   ┌──────────────┐   ┌──────────┐
│ STAGE 1  │──▶│ STAGE 2  │──▶│ STAGE 2.5    │──▶│ STAGE 3  │──▶│  STAGE 4     │──▶│ STAGE 5  │
│ SENSE    │   │ INFER    │   │ PERSONALIZE  │   │ DECIDE   │   │  COMPOSE     │   │ DELIVER  │
│(Wearable)│   │(Mood Map)│   │(User Prefs)  │   │(Target Δ)│   │  (Generate)  │   │(Playback)│
└──────────┘   └──────────┘   └──────────────┘   └──────────┘   └──────────────┘   └────┬─────┘
                                     ▲                                                   │
                                     │                              feedback loop ◀──────┘
                                     │
                               [Onboarding]
                               [Settings ⚙]
```

---

### STAGE 3 — DECIDE (Current State → Target State → Musical Parameters)

**Input:** Current emotional quadrant + user-selected target
**Output:** Musical feature vector (acoustic parameters for generation)

#### Step 3A: Determine Target

Two modes:
1. **User-explicit:** User taps a target mood on the circumplex (e.g., "I want to feel calm").
2. **Contextual/automatic:** Time-of-day heuristics (morning → energized, evening → calm). Stretch goal.

#### Step 3B: Compute the Emotional Delta

```
Δvalence = target.valence - current.valence
Δarousal = target.arousal - current.arousal
```

This vector tells us the *direction* and *magnitude* of the emotional shift needed.

#### Step 3C: Map Delta → Acoustic Features (THE CRITICAL CONVERTER)

This is the core intellectual contribution. We translate emotional vectors into music theory parameters.

| Acoustic Parameter | Controlled By | Mapping Logic |
|---|---|---|
| **Tempo (BPM)** | Arousal axis | Low arousal target → 60-80 BPM. High arousal target → 120-150 BPM. Gradient based on Δarousal. |
| **Mode** | Valence axis | High valence → Major key. Low valence → Minor key. Neutral → Mixolydian/Dorian. |
| **Harmonic Complexity** | Valence magnitude | High valence → Simple consonant progressions (I-IV-V). Low valence → Extended chords (7ths, 9ths, suspensions). |
| **Timbral Brightness** | Arousal axis | High arousal → Bright (high spectral centroid): brass, synth leads. Low arousal → Dark (low centroid): cello, pads, warm piano. |
| **Dynamic Range** | Arousal delta | Large Δarousal → Wide dynamics (build/release). Small Δ → Consistent, steady dynamics. |
| **Rhythmic Density** | Arousal axis | High arousal → Syncopation, subdivisions. Low arousal → Sparse, whole/half notes. |
| **Instrumentation** | Composite | Mapped from a preset palette per quadrant target (see below). |

#### Instrumentation Palette by Target Quadrant

```
Q1 (Excited/Euphoric):
  - Bright piano, acoustic guitar, major synths
  - Fast arpeggios, driving percussion
  - Reference: Upbeat lo-fi, feel-good indie

Q2 (Stressed/Angry → transition OUT, not into):
  - N/A as target. System never targets Q2.
  - If user IS in Q2, we route toward Q1 or Q4.

Q3 (Melancholic/Reflective):
  - Solo piano, strings, ambient pads
  - Slow harmonic rhythm, minor key
  - Reference: Satie, Nils Frahm

Q4 (Calm/Serene):
  - Warm piano, soft strings, nature-adjacent textures
  - Consonant harmony, slow tempo, legato
  - Reference: Debussy, Brian Eno ambient
```

#### The Bridging Principle

We don't jump directly to the target acoustic profile. We **bridge** — start with acoustic features that *match* the current state (so the music feels resonant, not jarring), then gradually morph toward the target over 3–5 minutes.

```
music_params(t) = current_params + (target_params - current_params) * ease(t / duration)
```

Where `ease()` is a sigmoid or cubic ease-in-out function.

#### Output Schema

```json
{
  "target_state": {
    "valence": 0.80,
    "arousal": 0.25,
    "quadrant": "Q4",
    "label": "calm/serene"
  },
  "music_params": {
    "tempo_bpm": 68,
    "mode": "major",
    "key": "C",
    "harmonic_complexity": 0.3,
    "brightness": 0.25,
    "dynamic_range": 0.4,
    "rhythmic_density": 0.2,
    "instrumentation": ["warm_piano", "soft_strings", "ambient_pad"],
    "duration_seconds": 300,
    "bridging": true,
    "bridge_start_tempo": 110,
    "bridge_start_mode": "minor"
  }
}
```

---

### STAGE 4 — COMPOSE (Musical Parameters → Generated Audio)

**Input:** Musical feature vector (from Stage 3)
**Output:** Playable audio (MP3/WAV stream)

#### Primary Tool: Google Lyria 2 (via MusicFX or Gemini API)

- **What it is:** Google DeepMind's music generation model. Text-to-music.
- **Access:** Available through Google AI Studio / Gemini API (check current availability) or MusicFX (consumer interface).
- **How we use it:** Convert our musical parameter vector into a **natural language prompt** for Lyria 2.

#### The Prompt Constructor (Black Box #2)

This module converts structured music params into a Lyria 2 prompt.

```python
def build_lyria_prompt(params: dict, user_prefs: dict = None) -> str:
    """
    Converts music_params JSON into a natural language generation prompt.
    If user_prefs are available, injects genre style language for personalization.
    """
    tempo_desc = "slow and gentle" if params["tempo_bpm"] < 80 else \
                 "moderate" if params["tempo_bpm"] < 110 else \
                 "upbeat and driving"

    mode_desc = "major key, warm and uplifting" if params["mode"] == "major" else \
                "minor key, introspective and emotional"

    instruments = ", ".join(params["instrumentation"]).replace("_", " ")

    brightness_desc = "soft, warm tones" if params["brightness"] < 0.4 else \
                      "balanced tones" if params["brightness"] < 0.7 else \
                      "bright, crisp tones"

    density_desc = "sparse, spacious arrangement" if params["rhythmic_density"] < 0.3 else \
                   "moderately layered" if params["rhythmic_density"] < 0.6 else \
                   "rich, densely layered"

    # Personalization injection: genre style language
    genre_clause = ""
    if user_prefs and user_prefs.get("genres"):
        genre_names = " and ".join(user_prefs["genres"][:3])  # cap at 3 for prompt clarity
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
    return prompt
```

**Example output prompt (personalized):**
> "Compose a slow and gentle instrumental piece in the style of metal and ambient, at approximately 95 BPM in A minor. Use synth pad, distorted guitar with clean reverb, drone, soft kick with balanced tones. The arrangement should be moderately layered with a consistent dynamic range. The mood should gradually transition from tense to peaceful. Duration: approximately 5 minutes."

#### Fallback Options (If Lyria 2 API Is Unavailable or Rate-Limited)

| Fallback | Pros | Cons |
|---|---|---|
| **Meta MusicGen** (open source, Hugging Face) | Self-hosted, no API limits, full control | Requires GPU, lower quality than Lyria 2 |
| **Riffusion** (open source, Stable Diffusion for audio) | Novel approach, hackathon-friendly | Experimental quality |
| **Pre-composed segment assembly** | Zero latency, guaranteed quality | Not truly generative, finite library |

For hackathon resilience, implement the pre-composed fallback: curate ~20 segments tagged by quadrant and morph parameters, crossfade between them based on Stage 3 output.

#### Output

- Audio stream (MP3 or WAV)
- Served via backend endpoint or streamed to frontend player

---

### STAGE 5 — DELIVER (Audio Playback + Feedback Loop)

**Input:** Generated audio stream
**Output:** Audio playback in browser + continuous biometric monitoring

#### Frontend Stack

| Component | Tool | Purpose |
|---|---|---|
| **Framework** | Next.js (App Router) | SSR, API routes, fast iteration |
| **UI Library** | Tailwind CSS + shadcn/ui | Clean, rapid prototyping |
| **Audio Playback** | Web Audio API / Howler.js | Low-latency audio playback, crossfading |
| **Circumplex Visualization** | D3.js or Canvas API | Real-time mood dot on the valence-arousal plane |
| **State Management** | React Context or Zustand | Pipe biometric updates through the UI |

#### The Feedback Loop

Once playback begins, the system continues polling Oura (or simulating updates for demo):

```
Every 60 seconds:
  1. Fetch latest biometric snapshot (Stage 1)
  2. Re-infer emotional state (Stage 2)
  3. Compare to target state
  4. If |current - target| > threshold:
       → Adjust music params (Stage 3)
       → Generate next segment (Stage 4)
       → Crossfade into new audio
  5. If |current - target| < threshold:
       → Maintain current track
       → Log "target reached" event
```

#### UI Wireframe (Key Screens)

**Screen 1 — Dashboard**
```
┌──────────────────────────────────────────────┐
│  RESONANCE                          [⚙ gear] │
│                                               │
│  ┌─────────────────────────────────┐          │
│  │     Valence-Arousal Map         │          │
│  │                                 │          │
│  │         ● (you are here)        │          │
│  │              ──▶ ○ (target)     │          │
│  │                                 │          │
│  └─────────────────────────────────┘          │
│                                               │
│  Current: Stressed (Q2)                       │
│  Target:  Calm (Q4)      [Change Target ▾]   │
│                                               │
│  ┌──────────────────────────────────┐         │
│  │  ▶  Generating your session...   │         │
│  │  ═══════════░░░░░░░░░  2:34     │         │
│  └──────────────────────────────────┘         │
│                                               │
│  HRV: 42ms │ HR: 78bpm │ Stress: 72          │
└──────────────────────────────────────────────┘
```

**Screen 2 — Target Selection**
```
┌──────────────────────────────────────────────┐
│  How do you want to feel?                     │
│                                               │
│  ┌──────────┐  ┌──────────┐                  │
│  │ Energized │  │ Focused  │                  │
│  │    ⚡     │  │    🎯    │                  │
│  └──────────┘  └──────────┘                  │
│  ┌──────────┐  ┌──────────┐                  │
│  │   Calm   │  │ Creative │                  │
│  │    🌊    │  │    💡    │                  │
│  └──────────┘  └──────────┘                  │
│                                               │
│  Or tap the circumplex for precise control ▸  │
└──────────────────────────────────────────────┘
```

---

## 5. Full Tech Stack Summary

| Layer | Technology | Role |
|---|---|---|
| **Wearable** | Oura Ring + Oura API v2 | Biometric data source |
| **Backend** | Next.js API Routes (or FastAPI if Python preferred) | Orchestration, all stage logic |
| **Mood Inference** | Custom deterministic model (Stage 2 formulas) | Physiology → Valence/Arousal |
| **User Preferences** | localStorage (hackathon) / Supabase (stretch) | Genre-mood mappings, acoustic profile overrides |
| **Preference Engine** | Custom genre→acoustic lookup + averaging | User prefs → Personalized acoustic base |
| **Music Mapping** | Custom rule engine (Stage 3 tables) | Emotion delta → Acoustic params (filtered by prefs) |
| **Prompt Construction** | Custom Python/JS function | Acoustic params → Lyria 2 prompt |
| **Music Generation** | Google Lyria 2 (primary), Meta MusicGen (fallback) | Text → Audio |
| **Audio Delivery** | Howler.js / Web Audio API | Browser playback, crossfading |
| **Frontend** | Next.js + Tailwind + D3.js | UI, circumplex visualization, onboarding |
| **Hosting** | Vercel (frontend) + Railway/Render (backend if split) | Deployment |

---

## 6. Hackathon Execution Roadmap

### Phase 0 — Setup (Hour 0–1)
- [ ] Scaffold Next.js project with Tailwind + shadcn
- [ ] Register Oura API developer app, get OAuth token
- [ ] Confirm Lyria 2 / MusicFX API access (or set up MusicGen fallback on Hugging Face)
- [ ] Set up repo, environment variables, basic project structure

### Phase 1 — Sense (Hour 1–3)
- [ ] Build Oura API integration module
- [ ] Fetch HRV, heart rate, skin temp, stress score
- [ ] Normalize values against user's baseline (use 7-day avg from Oura)
- [ ] Build mock data generator for demo resilience
- [ ] **Deliverable:** API route `/api/biometrics` returns normalized feature vector

### Phase 2 — Infer (Hour 3–4)
- [ ] Implement valence-arousal calculation (Stage 2 formulas)
- [ ] Map to quadrant with label
- [ ] Unit test with edge cases (all signals high, all low, mixed)
- [ ] **Deliverable:** API route `/api/mood` returns current quadrant + coordinates

### Phase 2.5 — Personalize (Hour 4–5.5)
- [ ] Build onboarding UI — genre multi-select grid per mood target (4 moods)
- [ ] Implement genre → acoustic profile lookup table (16 genres)
- [ ] Build preference averaging logic (multi-genre → blended acoustic base)
- [ ] Build softening transform for conflicting timbres (e.g., distorted → clean reverb in calm context)
- [ ] Implement localStorage persistence for preferences
- [ ] Build preferences API routes (`GET/POST /api/preferences`)
- [ ] **Deliverable:** Onboarding flow saves prefs; `/api/preferences/Q4` returns personalized acoustic profile

### Phase 3 — Decide (Hour 5.5–7)
- [ ] Build target selection logic (preset moods → valence/arousal coordinates)
- [ ] Implement delta calculation
- [ ] Build the acoustic parameter mapper — **now reads from user prefs first, falls back to defaults**
- [ ] Implement bridging curve (sigmoid transition over time)
- [ ] **Deliverable:** API route `/api/music-params` returns full personalized music feature vector

### Phase 4 — Compose (Hour 7–10)
- [ ] Build Lyria 2 prompt constructor (now includes genre/style language from prefs)
- [ ] Integrate with Lyria 2 API (or MusicGen if needed)
- [ ] Test generation with various parameter combinations
- [ ] Implement pre-composed fallback library (tag 15-20 segments by quadrant AND genre)
- [ ] Build crossfade logic for segment transitions
- [ ] **Deliverable:** API route `/api/generate` returns audio stream/URL

### Phase 5 — Deliver (Hour 10–13)
- [ ] Build dashboard UI (circumplex map, current state, target selector)
- [ ] Integrate audio player with crossfade support
- [ ] Wire up biometric polling → mood inference → UI updates
- [ ] Implement the feedback loop (re-evaluate every 60s)
- [ ] Animate the "mood dot" moving on the circumplex as music plays
- [ ] Add settings gear → re-open preference mapper to edit genre-mood associations
- [ ] **Deliverable:** Full working demo — onboard prefs, see your state, pick a target, hear *your* music, watch your dot move

### Phase 6 — Polish (Hour 13–14)
- [ ] Error handling, loading states, edge cases
- [ ] Demo script rehearsal
- [ ] README, slides, one-liner pitch
- [ ] Record backup demo video (in case of live demo failure)

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Oura API rate limits / slow polling | No real-time data | Pre-load 24h data + interpolation + mock mode |
| Lyria 2 API unavailable or waitlisted | No music generation | MusicGen fallback (self-hosted) or pre-composed segments |
| Mood inference inaccurate | System targets wrong state | Deterministic formula is transparent — user can override target manually |
| Audio generation latency (30s+) | Breaks real-time feel | Pre-generate next segment while current plays; buffer ahead |
| Valence hard to infer from physiology | Quadrant assignment wrong | Lean on stress score as primary valence proxy; allow user correction |

---

## 8. What Makes This Win

1. **The science is real.** Every link in the chain (HRV → mood, music → emotion) is backed by peer-reviewed research. This isn't speculation.
2. **The loop is closed.** This isn't a mood playlist. It's adaptive, generative, and responsive.
3. **The user has agency.** You're not being manipulated — you're choosing your target state and watching yourself move toward it.
4. **The demo is visual.** A dot moving on a circumplex while original music plays is inherently compelling.
5. **The implications are massive.** Anxiety management, focus enhancement, sleep preparation, athletic pre-competition priming — all without pharmaceuticals.

---

## 9. Key Research References

- Russell, J.A. (1980). "A Circumplex Model of Affect." *Journal of Personality and Social Psychology.*
- Thayer, J.F. & Lane, R.D. (2000). "A model of neurovisceral integration in emotion regulation." *Journal of Affective Disorders.*
- Juslin, P.N. & Västfjäll, D. (2008). "Emotional responses to music: The need to consider underlying mechanisms." *Behavioral and Brain Sciences.*
- Koelstra, S. et al. (2012). "DEAP: A Database for Emotion Analysis using Physiological Signals." *IEEE Transactions on Affective Computing.*
- Eerola, T. & Vuoskoski, J.K. (2013). "A review of music and emotion studies: Approaches, emotion models, and stimuli." *Music Perception.*

---

*Resonance: You already know how you feel. Now choose how you want to feel.*
