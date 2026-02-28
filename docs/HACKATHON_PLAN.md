# PULSE v2 — Gemini 3 NYC Hackathon Working Plan

**Date:** February 28, 2026
**Submission Deadline:** 5:00 PM EST
**Location:** The Malin Flatiron (895 Broadway, 5th floor, NYC)
**Team:** Ani, Isha, Kapil
**Track:** Gemini and Music

---

## CURRENT STATUS (as of kickoff)

- [x] Repo created: `ishamehra/g3-hack` (public, as required)
- [x] Oura API data checker working (`oura_data_checker.py`)
- [ ] Everything else

---

## THE IDEA: PULSE

**One-liner:** A biometric-driven adaptive music system that reads your body (wearables, Apple Health), your environment (weather, time), and your context — then uses Gemini to interpret your physiological state and drive a real-time music experience.

**Why this idea:**
- Track 1 (Gemini and Music) — directly on target
- Uses Gemini as an **intelligence layer** (not a pipe) — interprets multi-signal biometric state into musical decisions
- Menstrual cycle integration = unique differentiator nobody else will have
- M5Stack Core2 hardware = physical demo presence
- Multiple signal sources with confidence-weighted fusion = technically impressive

---

## PRIORITIES  

1. **Oura Ring / Wearable data pipeline** — already started, highest signal quality
2. **Apple Health integration** — broad biometric data (steps, HR, sleep)
3. **M5Stack Core2 connection** — physical hardware demo, abstract to work with RPi/phone too
4. **Spotify queue control** — real-time updating song queue on existing music player
5. **Gemini interpretation layer** — state vector → music parameters via Gemini 2.5/3
6. **Temporal workflows** — orchestrate the signal→interpret→play pipeline
7. **Lyria RealTime AI-generated music** — dynamic music generation based on biometric data

### De-prioritized:
- Webcam rPPG — unless it can be **non-intrusive facial expression analysis** that's genuinely accurate and helpful, skip for now
- LlamaIndex/LlamaParse — unclear use case here. Sheet music generation is not worth the time. **Skip unless a clear use emerges.**

---

## REVISED ARCHITECTURE (Hackathon-Realistic)

```
SIGNAL PROVIDERS                    INTERPRETATION              OUTPUT
─────────────────                   ──────────────              ──────

┌──────────────┐                                               ┌─────────────┐
│  Oura Ring   │──┐                                            │  Spotify    │
│  (cloud API) │  │                                            │  Queue      │
└──────────────┘  │   ┌──────────────┐   ┌─────────────┐      │  Control    │
                  ├──→│   Signal     │──→│   Gemini    │──→   ├─────────────┤
┌──────────────┐  │   │  Normalizer  │   │   2.5/3     │      │  M5Stack    │
│ Apple Health │──┤   │  + State     │   │  Interpret  │      │  Core2      │
│ (export/API) │  │   │  Compositor  │   │  Layer      │      │  Display    │
└──────────────┘  │   └──────────────┘   └─────────────┘      ├─────────────┤
                  │                                            │  Web UI     │
┌──────────────┐  │                                            │  Dashboard  │
│  Weather +   │──┤                                            └─────────────┘
│  Circadian   │  │
└──────────────┘  │
                  │
┌──────────────┐  │
│  Menstrual   │──┘
│  Cycle Data  │
└──────────────┘

Orchestrated by Temporal workflows
```


---

## TIME BLOCKS (10:30 AM → 5:00 PM)

### BLOCK 1: Foundation (10:30 AM - 12:00 PM) — 1.5 hrs
- [ ] Set up project structure (Python backend, FastAPI or Flask)
- [ ] Oura Ring real-time polling service (extend existing checker → streaming)
- [ ] Define BiometricSignal schema + State Vector
- [ ] Apple Health data export/integration research + cycle data input
- [ ] Weather API (OpenWeatherMap) + circadian phase logic
- [ ] Start pitch script outline

### BLOCK 2: Core Pipeline (12:00 PM - 2:00 PM) — 2 hrs
- [ ] Gemini interpretation layer — state vector → music parameters (structured JSON output)
- [ ] Temporal workflow: signal collection → state composition → Gemini call → output
- [ ] Menstrual cycle phase mapper + confidence scoring
- [ ] Web UI scaffold (biometric dashboard)
- [ ] Spotify Web API integration (OAuth + queue control)
- [ ] M5Stack Core2 display (current state visualization)

### BLOCK 3: Integration (2:00 PM - 3:30 PM) — 1.5 hrs
- [ ] Wire everything together end-to-end
- [ ] Parameter mixer (deterministic mappings + Gemini blend)
- [ ] Dashboard showing live signals, state vector, current music
- [ ] M5Stack ↔ backend communication

### BLOCK 4: Demo Polish (3:30 PM - 4:30 PM) — 1 hr
- [ ] End-to-end demo run-throughs
- [ ] UI polish, visualizations
- [ ] Record 1-minute demo video (required for submission)
- [ ] Finalize pitch script

### BLOCK 5: Submit (4:30 PM - 5:00 PM) — 30 min buffer
- [ ] Submit at cerebralvalley.ai
- [ ] Upload demo video (YouTube/Loom)
- [ ] Ensure repo is public with README

---

## TECH STACK

| Component | Technology | Why |
|-----------|-----------|-----|
| Backend | Python (FastAPI) | Fast to build, team knows it |
| AI Brain | Gemini 2.5 Flash / Gemini 3 | Hackathon requirement, structured output |
| Orchestration | Temporal | Required sponsor tech, handles signal→interpret→play pipeline |
| Database | Supabase (if needed) | Real-time, free tier |
| Music Output | Spotify Web API | Reliable, high quality, familiar UX |
| Hardware | M5Stack Core2 | Physical demo presence |
| Wearable | Oura Ring API v2 | Already working |
| Health Data | Apple Health (export) | Broad biometric signals |
| Weather | OpenWeatherMap API | Free, simple |
| Frontend | HTML/JS or React (lightweight) | Dashboard + visualizer |

---

## GEMINI USAGE (Maximize for Judging)

Gemini is the **brain** of the system. It should be used for:

1. **State Interpretation** — Given a full physiological state vector, generate structured music parameters
   - Input: `{ cardiac: {...}, stress: {...}, hormonal: {...}, circadian: {...}, environment: {...} }`
   - Output: `{ mood: "focused-warm", energy: 0.6, valence: 0.7, genres: ["lo-fi", "ambient"], bpm_range: [70, 90], reasoning: "..." }`

2. **Song Selection Intelligence** — Given music parameters + user's Spotify library/preferences, pick the right songs
   - This is where Gemini 3's reasoning shines — it's not just genre matching, it's understanding WHY this song fits this physiological moment

3. **Contextual Narration** — Generate the "why" text shown on dashboard
   - "Your HRV is elevated and you're in your ovulatory phase — selecting bright, confident tracks to match your peak energy"

4. **Multimodal potential** — If time, Gemini can analyze audio features of queued songs to ensure smooth transitions

---

## TEMPORAL USAGE

Temporal orchestrates the continuous pipeline:

```
Workflow: PulseSession
├── Activity: CollectOuraSignals (every 30s)
├── Activity: CollectAppleHealthSignals (on session start + periodic)
├── Activity: CollectWeatherData (on session start + every 30min)
├── Activity: ComputeCircadianPhase (every 5min)
├── Activity: InputCycleData (on session start, manual)
├── Activity: ComposeStateVector (every 30s, fuses all signals)
├── Activity: GeminiInterpret (every 60s, calls Gemini with state vector)
├── Activity: UpdateSpotifyQueue (when Gemini returns new params)
├── Activity: UpdateM5StackDisplay (every 10s)
└── Signal: SessionEnd → cleanup
```

---

## MENSTRUAL CYCLE INTEGRATION

**Data input options (for Esha):**
1. Simple UI input: "Last period start date" → compute cycle day + phase
2. Oura cycle tracking API (if Esha uses it)
3. Apple Health menstrual data export

**Phase mapping to music parameters:**

| Phase | Days | Energy | Valence | Tempo | Texture |
|-------|------|--------|---------|-------|---------|
| Menstrual | 1-5 | 0.3 | 0.3 | Slow | Warm, soft |
| Follicular | 6-13 | 0.5 | 0.5 | Rising | Brightening |
| Ovulatory | 14-16 | 0.8 | 0.8 | Upbeat | Full, confident |
| Luteal (early) | 17-23 | 0.5 | 0.5 | Steady | Grounded |
| Luteal (late) | 24-28 | 0.3 | 0.4 | Slow | Gentle |

**This is our biggest differentiator.** Music that understands hormonal rhythms, not just heartbeat.

---

## M5STACK / HARDWARE ABSTRACTION

Current: M5Stack Core2 physically present
Goal: Abstract so it works with:
- M5Stack Core2 (current hardware)
- Raspberry Pi (GPIO + speaker)
- Phone/macOS Spotify app (just queue control, no hardware needed)

**Abstraction layer:**
```python
class MusicOutput(ABC):
    async def update_queue(self, songs: list[str]) -> None: ...
    async def display_state(self, state: PhysiologicalState) -> None: ...

class SpotifyOutput(MusicOutput): ...      # Queue control via Spotify API
class M5StackOutput(MusicOutput): ...      # Serial/WiFi to M5Stack
class RaspberryPiOutput(MusicOutput): ...  # GPIO + local playback
```

---

## SUBMISSION REQUIREMENTS

- [x] Public GitHub repo
- [ ] 1-minute demo video (YouTube/Loom)
- [ ] Submit at: https://cerebralvalley.ai/e/gemini-3-nyc-hackathon/hackathon/submit
- [ ] All code written during hackathon (no prior work)
- [ ] Must use Google AI products (Gemini)

**Judging criteria:**
- **Demo (50%)** — Does it work? This is HALF the score.
- **Impact (25%)** — Long-term potential, usefulness
- **Creativity (15%)** — Is the concept innovative?
- **Pitch (10%)** — How well do you present?

---

## LLAMAINDEX / LLAMAPARSE VERDICT

**Skip for now.** No clear use case that justifies the time investment:
- Sheet music generation — not worth it for a demo
- RAG over health docs — adds complexity without demo value
- Could potentially use LlamaIndex to index Spotify catalog metadata for better song matching, but Gemini can handle this directly

**Revisit only if:** We finish core pipeline early and need to add "wow" factor.

---

## DEMO SCRIPT (3 minutes)

**0:00-0:30 — Hook**
Esha wearing Oura ring. Music playing through Spotify. "This playlist was composed for my body, right now. My heart rate. My cycle. The weather outside."

**0:30-1:00 — Live Biometrics**
Show dashboard: HR, HRV from Oura, cycle day 14 (ovulatory), weather (overcast, cold NYC). "Gemini is interpreting all of these signals together — not just mapping numbers, but understanding context."

**1:00-1:30 — Gemini in Action**
Show Gemini's reasoning on screen: "Ovulatory phase with elevated HRV on an overcast afternoon → selecting bright but grounded tracks." Song transitions on Spotify. M5Stack shows state.

**1:30-2:15 — Technical Architecture**
Flash architecture diagram. "5 signal providers, normalized into one state vector. Gemini interprets the full physiological context. Temporal orchestrates the pipeline. Output to any music player."

**2:15-3:00 — Vision**
"Today it's personalized. Tomorrow: couples syncing during meditation. Yoga classes where collective breath drives the soundtrack. Athletes whose music adapts to training zones. Your body has always been making music. Pulse makes it audible."

---

## OURA DATA — WHAT WE HAVE (Esha's Ring, Live Data)

Esha's Oura checker successfully retrieved ALL endpoints. Here's what we can feed into the pipeline **right now**:

### Personal Profile
- Age: 30, Female, 65.3kg, 160cm
- This gives us baseline context for Gemini (resting HR norms, cycle relevance, etc.)

### Real-Time Heart Rate (1,038 data points in last 24h)
- Sample: `{ timestamp: "2026-02-27T10:30:16.000Z", bpm: 60, source: "rest" }`
- **This is the golden signal.** 60 BPM resting = low/calm state
- Source field tells us: `rest` vs `active` vs `workout` — context for free
- Poll every 30s for near-real-time updates

### Daily Sleep (8 days of data)
- Score: 70 (moderate)
- Contributors: deep_sleep=85, efficiency=58, latency=97, rem_sleep=62, restfulness=65, timing=48, total_sleep=73
- **Use for Gemini context:** "User had moderate sleep (score 70, low efficiency) — may need energizing music this morning"

### Daily Readiness (8 days)
- Contributors: activity_balance=69, body_temp=91, hrv_balance=82, previous_day_activity=68, previous_night=65, recovery_index=100, resting_heart_rate=44
- resting_heart_rate contributor = 44 (very good)
- **Use for Gemini:** "Readiness score indicates good recovery but suboptimal sleep balance"

### Daily Stress (8 days)
- day_summary: "normal"
- recovery_high: 5400 (seconds in recovery)
- stress_high: 14400 (seconds in stress)
- **Ratio: ~73% stress, ~27% recovery** — this is a busy person. Music should help manage this.

### Daily Resilience (8 days)
- sleep_recovery: 49.8, daytime_recovery: 42.7, stress: 69.4
- level: "solid"
- **Good stress tolerance but recovery could be better**

### Sleep Detail (12 records)
- average_breath: 17.75/min
- average_heart_rate: 70.75 BPM (during sleep)
- average_hrv: 74 ms (decent HRV)
- **HRV of 74 for a 30yo female = healthy parasympathetic tone**

### Workouts (8 records)
- Recent: **dance** workout, moderate intensity, 171 cal
- This tells us activity preferences — Gemini can factor this in

### Tags (3 records)
- tag_generic_nap — she naps! Context for energy patterns.

### What's NOT Available
- Sessions: 0 records (meditation/guided sessions not used)
- Menstrual cycle: Need to check if Oura tracks this OR use manual input

### Concrete Signal Map for Our Pipeline

| Oura Endpoint | Signal Type | Update Frequency | Confidence |
|---------------|------------|------------------|------------|
| heartrate | cardiac.hr | Every 30s (polling) | 0.95 |
| daily_sleep | sleep.score + contributors | Once/day | 0.90 |
| daily_readiness | energy.readiness | Once/day | 0.90 |
| daily_stress | stress.level + ratio | Once/day | 0.85 |
| daily_resilience | stress.resilience | Once/day | 0.85 |
| sleep (detail) | cardiac.hrv, cardiac.resting_hr | Once/day | 0.90 |
| workout | activity.recent_type | On occurrence | 0.90 |
| personal_info | profile.baseline | Once/session | 0.95 |

---

## KEY API CREDENTIALS NEEDED

- [ ] Oura Personal Access Token (have it)
- [ ] Gemini API key ($20 credit from hackathon: https://trygcp.dev/claim/cerebral-valley)
- [ ] Spotify Developer App (Client ID + Secret)
- [ ] OpenWeatherMap API key (free tier)
- [ ] Temporal Cloud or local dev server
- [ ] Supabase project (if using)
