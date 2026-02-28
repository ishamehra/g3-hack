from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from temporalio.client import Client
from temporalio.worker import Worker

from resonance.activities import (
    call_gemini,
    compose_state_activity,
    poll_oura,
    set_lyria_manager,
    update_lyria,
    upsert_supabase,
)
from resonance.lyria_manager import LyriaManager
from resonance.models import SessionInput
from resonance.supabase_client import create_session, get_supabase, insert_signal
from resonance.workflows import BiofeedbackWorkflow

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("resonance")

# ── Global state ─────────────────────────────────────────────────────

audio_clients: set[WebSocket] = set()
lyria_manager = LyriaManager()
workflow_handle = None
audio_task: asyncio.Task | None = None
current_session_id: str | None = None


# ── Lyria audio → browser bridge ─────────────────────────────────────


async def stream_lyria_audio():
    """Background task: receive PCM audio from Lyria and forward to /ws clients."""
    try:
        async for chunk in lyria_manager.receive_audio():
            audio_b64 = base64.b64encode(chunk).decode()
            msg = json.dumps({"type": "audio", "audio": audio_b64})
            disconnected: set[WebSocket] = set()
            for ws in audio_clients:
                try:
                    await ws.send_text(msg)
                except Exception:
                    disconnected.add(ws)
            audio_clients.difference_update(disconnected)
    except Exception as e:
        logger.error("Audio stream error: %s", e)


# ── FastAPI lifespan (start Temporal worker) ─────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to local Temporal dev server
    client = await Client.connect(
        os.environ.get("TEMPORAL_ADDRESS", "localhost:7233"),
    )
    app.state.temporal_client = client

    # Wire activity singletons
    set_lyria_manager(lyria_manager)

    # Initialize Supabase client (validates env vars early)
    try:
        get_supabase()
        logger.info("Supabase client initialized")
    except Exception as e:
        logger.warning("Supabase not configured: %s", e)

    # Start Temporal worker as background task
    worker = Worker(
        client,
        task_queue="resonance",
        workflows=[BiofeedbackWorkflow],
        activities=[
            poll_oura,
            compose_state_activity,
            call_gemini,
            upsert_supabase,
            update_lyria,
        ],
    )
    worker_task = asyncio.create_task(worker.run())
    logger.info("Temporal worker started on task queue 'resonance'")

    yield

    # Cleanup
    if lyria_manager.is_running():
        await lyria_manager.stop()
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="RESONANCE", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request models ───────────────────────────────────────────────────


class StartSessionRequest(BaseModel):
    target_mood: str = "focused"
    genres: str = ""
    cycle_start_date: str | None = None
    cycle_length: int = 28


class CycleUpdateRequest(BaseModel):
    cycle_start_date: str
    cycle_length: int = 28


class SignalIngestRequest(BaseModel):
    provider: str
    signal_type: str
    value: float | None = None
    value_text: str | None = None
    unit: str | None = None
    confidence: float = 1.0
    metadata: dict | None = None


# ── REST endpoints ───────────────────────────────────────────────────


@app.post("/api/session/start")
async def start_session(req: StartSessionRequest):
    """Create a Supabase session row, start Lyria, start Temporal workflow."""
    global workflow_handle, audio_task, current_session_id

    genre_list = [g.strip() for g in req.genres.split(",") if g.strip()]

    # 1. Create Supabase session
    try:
        session_id = await create_session(
            target_mood=req.target_mood,
            genre_preferences=genre_list,
            cycle_start_date=req.cycle_start_date,
            cycle_length=req.cycle_length,
        )
        current_session_id = session_id
    except Exception as e:
        logger.warning("Supabase session creation failed: %s", e)
        session_id = f"local-{datetime.now().strftime('%H%M%S')}"
        current_session_id = session_id

    # 2. Start Lyria streaming
    if not lyria_manager.is_running():
        await lyria_manager.start()
    audio_task = asyncio.create_task(stream_lyria_audio())

    # 3. Start Temporal workflow
    client: Client = app.state.temporal_client
    session_input = SessionInput(
        session_id=session_id,
        user_id="demo",
        target_mood=req.target_mood,
        genre_preferences=genre_list,
    )
    wf_id = f"resonance-{datetime.now().strftime('%H%M%S')}"
    workflow_handle = await client.start_workflow(
        BiofeedbackWorkflow.run,
        session_input,
        id=wf_id,
        task_queue="resonance",
    )
    logger.info("Session %s started (workflow %s)", session_id, wf_id)
    return {"status": "started", "session_id": session_id, "workflow_id": wf_id}


@app.post("/api/session/stop")
async def stop_session():
    global workflow_handle, audio_task, current_session_id

    if workflow_handle:
        await workflow_handle.signal(BiofeedbackWorkflow.stop)
        workflow_handle = None
    if audio_task:
        audio_task.cancel()
        audio_task = None
    await lyria_manager.stop()
    current_session_id = None
    return {"status": "stopped"}


@app.post("/api/session/cycle")
async def update_cycle(req: CycleUpdateRequest):
    """Update cycle data on the current session."""
    if not current_session_id:
        return {"error": "no active session"}
    try:
        sb = get_supabase()
        sb.table("sessions").update({
            "cycle_tracking_enabled": True,
            "cycle_start_date": req.cycle_start_date,
            "cycle_length": req.cycle_length,
        }).eq("id", current_session_id).execute()
    except Exception as e:
        logger.warning("Cycle update failed: %s", e)
    return {"status": "updated", "session_id": current_session_id}


@app.post("/api/signals/ingest")
async def ingest_signal(req: SignalIngestRequest):
    """Insert a raw biometric signal into the signals table."""
    if not current_session_id:
        return {"error": "no active session"}
    try:
        await insert_signal(
            session_id=current_session_id,
            provider=req.provider,
            signal_type=req.signal_type,
            value=req.value,
            value_text=req.value_text,
            unit=req.unit,
            confidence=req.confidence,
            metadata=req.metadata,
        )
    except Exception as e:
        logger.warning("Signal ingest failed: %s", e)
    return {"status": "ingested"}


@app.get("/api/session/state")
async def get_state():
    if workflow_handle:
        return await workflow_handle.query(BiofeedbackWorkflow.current_state)
    return {}


@app.post("/api/mood")
async def set_mood(mood: str):
    if workflow_handle:
        await workflow_handle.signal(BiofeedbackWorkflow.update_mood, mood)
    return {"mood": mood}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "lyria_running": lyria_manager.is_running(),
        "workflow_active": workflow_handle is not None,
        "session_id": current_session_id,
        "audio_clients": len(audio_clients),
    }


# ── WebSocket endpoint (audio-only) ─────────────────────────────────


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """Audio-only WebSocket. State delivery is via Supabase Realtime."""
    await ws.accept()
    audio_clients.add(ws)
    logger.info("Audio client connected (%d total)", len(audio_clients))
    try:
        while True:
            # Keep connection alive; accept client messages for control
            raw = await ws.receive_text()
            data = json.loads(raw)
            msg_type = data.get("type")

            if msg_type == "set_target" and workflow_handle:
                await workflow_handle.signal(
                    BiofeedbackWorkflow.update_mood, data["target"],
                )
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error("WebSocket error: %s", e)
    finally:
        audio_clients.discard(ws)
        logger.info("Audio client disconnected (%d remaining)", len(audio_clients))


# ── Entrypoint ───────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "8000")))
