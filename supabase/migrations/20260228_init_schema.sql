-- RESONANCE: Core schema for biometric-driven music generation
-- Tables: sessions, signals, lyria_params

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oura_connected BOOLEAN DEFAULT false,
    cycle_tracking_enabled BOOLEAN DEFAULT false,
    cycle_start_date DATE,
    cycle_length INTEGER DEFAULT 28,
    target_mood TEXT DEFAULT 'focused',
    genre_preferences JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw biometric signals
CREATE TABLE IF NOT EXISTS signals (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id),
    provider TEXT NOT NULL,
    signal_type TEXT NOT NULL,
    value DOUBLE PRECISION,
    value_text TEXT,
    unit TEXT,
    confidence DOUBLE PRECISION DEFAULT 1.0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_signals_session_type
    ON signals(session_id, signal_type, recorded_at DESC);

-- Computed Lyria params (frontend subscribes via Realtime)
CREATE TABLE IF NOT EXISTS lyria_params (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(id) UNIQUE,
    weighted_prompts JSONB NOT NULL DEFAULT '[]',
    bpm INTEGER NOT NULL DEFAULT 80,
    density DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    brightness DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    scale TEXT NOT NULL DEFAULT 'C_MAJOR_A_MINOR',
    guidance DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    temperature DOUBLE PRECISION NOT NULL DEFAULT 1.1,
    mood_label TEXT NOT NULL DEFAULT 'Neutral',
    instruments JSONB NOT NULL DEFAULT '["piano"]',
    narration TEXT DEFAULT '',
    emotional_state JSONB DEFAULT '{}',
    biometrics JSONB DEFAULT '{}',
    circadian_phase TEXT DEFAULT '',
    cycle_phase TEXT,
    weather JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime on lyria_params so frontend auto-receives updates
ALTER PUBLICATION supabase_realtime ADD TABLE lyria_params;
