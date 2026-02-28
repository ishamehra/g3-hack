from __future__ import annotations

import logging
import os

from supabase import create_client, Client

from resonance.models import SupabaseLyriaRow

logger = logging.getLogger(__name__)

_client: Client | None = None


def get_supabase() -> Client:
    """Get or create the Supabase client singleton."""
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _client = create_client(url, key)
    return _client


async def create_session(
    target_mood: str = "focused",
    genre_preferences: list[str] | None = None,
    cycle_start_date: str | None = None,
    cycle_length: int = 28,
) -> str:
    """Create a new session row in Supabase. Returns the session UUID."""
    sb = get_supabase()
    row = {
        "target_mood": target_mood,
        "genre_preferences": genre_preferences or [],
    }
    if cycle_start_date:
        row["cycle_tracking_enabled"] = True
        row["cycle_start_date"] = cycle_start_date
        row["cycle_length"] = cycle_length
    result = sb.table("sessions").insert(row).execute()
    session_id = result.data[0]["id"]
    logger.info("Created Supabase session: %s", session_id)
    return session_id


async def insert_signal(
    session_id: str,
    provider: str,
    signal_type: str,
    value: float | None = None,
    value_text: str | None = None,
    unit: str | None = None,
    confidence: float = 1.0,
    metadata: dict | None = None,
) -> None:
    """Insert a raw biometric signal into the signals table."""
    sb = get_supabase()
    row = {
        "session_id": session_id,
        "provider": provider,
        "signal_type": signal_type,
        "value": value,
        "value_text": value_text,
        "unit": unit,
        "confidence": confidence,
        "metadata": metadata or {},
    }
    sb.table("signals").insert(row).execute()


async def upsert_lyria_params(params: SupabaseLyriaRow) -> None:
    """UPSERT the full state into lyria_params table.

    This triggers Supabase Realtime to push the update to
    any frontend clients subscribed to this session's row.
    """
    sb = get_supabase()
    data = params.model_dump()
    # Remove None values to let DB defaults apply
    data = {k: v for k, v in data.items() if v is not None}
    sb.table("lyria_params").upsert(
        data, on_conflict="session_id"
    ).execute()
    logger.info("Upserted lyria_params for session %s", params.session_id)
