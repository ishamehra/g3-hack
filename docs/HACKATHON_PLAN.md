# RESONANCE — Canonical Hackathon Plan

**Date:** February 28, 2026
**Team:** Ani (backend infra), Isha (interpreter/intelligence), Kap (frontend)
**Track:** Gemini and Music

---

## One-Liner

A closed-loop biometric music system: reads your body (Oura Ring, circadian rhythm, menstrual cycle, weather), uses Gemini to interpret your physiological state, and drives Lyria RealTime to generate original music that guides you toward your target mood.

---

## Architecture

```
BIOMETRIC SIGNALS         TEMPORAL WORKFLOW              DELIVERY
─────────────────         ─────────────────              ────────

┌──────────────┐          ┌─────────────────────────┐
│ Oura Ring    │──┐       │  BiofeedbackWorkflow     │    ┌─────────────────┐
│ (HR, HRV,   │  │       │  (30s loop, durable)     │    │ Supabase        │
│  stress,     │  │       │                          │    │ (Realtime)      │
│  sleep)      │  │       │  1. poll_oura            │    │                 │
└──────────────┘  │       │  2. compose_state        │    │ lyria_params    │
                  │       │  3. call_gemini          │───→│ table UPSERT    │───→ Frontend
┌──────────────┐  │       │  4. upsert_supabase      │    │ (auto-notify)   │    (subscribes)
│ Weather API  │──┤       │  5. update_lyria         │    └─────────────────┘
└──────────────┘  │       │                          │
                  │       │  Signals: update_mood,   │    ┌─────────────────┐
┌──────────────┐  │       │           stop           │    │ Lyria RealTime  │
│ Circadian    │──┤       │  Queries: current_state  │    │ (Music API)     │
└──────────────┘  │       └─────────────────────────┘    │                 │
                  │                                      │ 48kHz stereo    │
┌──────────────┐  │       ┌─────────────────┐            │ PCM streaming   │
│ Cycle Input  │──┘       │ Temporal Dev     │            └────────┬────────┘
└──────────────┘          │ Server :7233     │                     │
                          └─────────────────┘                     ▼
                                                         FastAPI /ws endpoint
                                                         (audio chunks only)
                                                              │
                                                              ▼
                                                         Frontend
                                                         Web Audio API
```

**Two delivery channels:**
1. **Supabase Realtime** → state/params/narration (`lyria_params` table subscription)
2. **Direct WebSocket** (`/ws`) → raw PCM audio chunks (high bandwidth, 48kHz stereo)

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Python FastAPI |
| AI Brain | Gemini 2.0 Flash (interpreter) |
| Music Gen | Lyria RealTime Music API (`lyria-realtime-exp`) |
| Orchestration | Temporal (30s durable loop) |
| Database + Realtime | Supabase (sessions, signals, lyria_params) |
| Wearable | Oura Ring API v2 |
| Weather | OpenWeatherMap |
| Frontend | Next.js + Supabase Realtime + Web Audio API |

---

## Supabase Schema

**Project:** `https://wvhdixzdfskwtuibuudz.supabase.co`

### Tables

**sessions** — one row per listening session
- `id` UUID PK, `oura_connected`, `cycle_tracking_enabled`, `cycle_start_date`, `cycle_length`, `target_mood`, `genre_preferences` JSONB, `created_at`

**signals** — raw biometric signal log
- `id` BIGSERIAL PK, `session_id` FK→sessions, `provider`, `signal_type`, `value`, `value_text`, `unit`, `confidence`, `recorded_at`, `metadata` JSONB

**lyria_params** — computed state (frontend subscribes via Realtime)
- `id` BIGSERIAL PK, `session_id` FK→sessions (UNIQUE), `weighted_prompts` JSONB, `bpm`, `density`, `brightness`, `scale`, `guidance`, `temperature`, `mood_label`, `instruments` JSONB, `narration`, `emotional_state` JSONB, `biometrics` JSONB, `circadian_phase`, `cycle_phase`, `weather` JSONB, `updated_at`

Realtime enabled on `lyria_params` via `ALTER PUBLICATION supabase_realtime ADD TABLE lyria_params`.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/session/start` | Create Supabase session + start Temporal + start Lyria |
| POST | `/api/session/stop` | Stop workflow + Lyria |
| POST | `/api/session/cycle` | Update cycle tracking data |
| POST | `/api/signals/ingest` | Insert raw signal into signals table |
| GET | `/api/session/state` | Query current workflow state |
| POST | `/api/mood` | Signal mood change to workflow |
| GET | `/health` | Health check |
| WS | `/ws` | Audio-only WebSocket (PCM chunks) |

---

## Frontend Contract

### Supabase Realtime (lyria_params row)

```json
{
  "session_id": "uuid",
  "weighted_prompts": [{"text": "warm lo-fi", "weight": 0.8}],
  "bpm": 82,
  "density": 0.35,
  "brightness": 0.4,
  "scale": "D_MAJOR_B_MINOR",
  "guidance": 3.5,
  "temperature": 1.1,
  "mood_label": "Deep Focus",
  "instruments": ["piano", "ambient_pad"],
  "narration": "Your HR is settling at 78. Afternoon dip + ovulatory energy → warm lo-fi.",
  "emotional_state": {"valence": 0.55, "arousal": 0.45, "quadrant": "Q4", "label": "focused"},
  "biometrics": {"hr": 78, "hrv": 74, "stress_pct": 0.3, "sleep_score": 70},
  "circadian_phase": "afternoon_dip",
  "cycle_phase": "ovulatory",
  "weather": {"temp_f": 38, "condition": "overcast"},
  "updated_at": "2026-02-28T..."
}
```

### Audio WebSocket (`/ws`)

```json
{"type": "audio", "audio": "<base64 PCM chunk>"}
```

Format: 16-bit PCM, 48kHz, stereo.

---

## Lyria Music API Surface

```python
session = await client.aio.live.music.connect(model='models/lyria-realtime-exp')
session.set_weighted_prompts([WeightedPrompt(text='...', weight=1.0)])
session.set_music_generation_config(MusicGenerationConfig(bpm=80, density=0.4, ...))
session.play() / session.pause() / session.stop()
session.reset_context()  # needed after BPM/scale changes
# Audio via: async for msg in session: msg.server_content.audio_chunks[].data
```

Config: `bpm` (60-200), `density` (0-1), `brightness` (0-1), `scale` (enum), `guidance` (0-6), `temperature` (0-3)

Scale enums: `C_MAJOR_A_MINOR`, `D_FLAT_MAJOR_B_FLAT_MINOR`, `D_MAJOR_B_MINOR`, `E_FLAT_MAJOR_C_MINOR`, `E_MAJOR_D_FLAT_MINOR`, `F_MAJOR_D_MINOR`, `G_FLAT_MAJOR_E_FLAT_MINOR`, `G_MAJOR_E_MINOR`, `A_FLAT_MAJOR_F_MINOR`, `A_MAJOR_G_FLAT_MINOR`, `B_FLAT_MAJOR_G_MINOR`, `B_MAJOR_A_FLAT_MINOR`

---

## Gemini Interpreter (The Brain)

**File:** `resonance/gemini_interpreter.py`

Gemini 2.0 Flash receives the full composite state (HR, HRV, stress, sleep, weather, circadian phase, cycle phase, target mood, genre prefs) and returns:
- Emotional coordinates (valence, arousal, quadrant)
- Lyria params (bpm, density, brightness, scale, guidance, temperature)
- Display fields (mood_label, instruments)
- Weighted text prompts for Lyria
- Human-readable narration

Key interpretation rules:
- High HR + high stress → calming music (oppose state) unless target is "energized"
- Low HRV → gentle, steady rhythms
- Luteal phase → warmer/softer; ovulatory → more energy
- Afternoon dip → gentle uplift; morning peak → match energy
- Cold/overcast weather → warmer sounds
- Always honor the user's target mood

---

## Team Responsibilities

### Ani — Backend Infrastructure
- Temporal workflow + activities
- Lyria Music API integration
- Supabase client + schema
- FastAPI endpoints + WebSocket

### Isha — Interpreter / Intelligence Layer
- `gemini_interpreter.py` — system prompt, response schema, interpretation logic
- `state_compositor.py` — signal fusion rules
- `cycle.py` — menstrual cycle phase mapping
- `genre_profiles.py` — genre → acoustic profile mapping
- Tuning Gemini prompts for musical quality

### Kap — Frontend
- Next.js dashboard with Supabase Realtime subscription
- Web Audio API for PCM playback from `/ws`
- Mood selector UI
- Biometric + emotional state visualization

---

## Verification Checklist

- [ ] Supabase schema: tables visible in dashboard
- [ ] Temporal + Supabase: workflow runs → lyria_params row updates every 30s
- [ ] Lyria streams: connect → play() → audio chunks arrive → forwarded on /ws
- [ ] Frontend receives state: Supabase Realtime subscription works
- [ ] Frontend receives audio: /ws → decode PCM → Web Audio API playback
- [ ] Mood signal: POST /api/mood → workflow picks up → Gemini → Supabase → music shifts
- [ ] End-to-end: full loop within one 30s iteration
   