# KAPIL — WebSocket Integration Prompts (replaces K12 + K13 from original)

> These replace the Temporal Client SDK and API stub prompts.
> Run these AFTER K11 (mood dot animation) is done.

---

### K12-NEW. WebSocket Client Hook

```
Build a WebSocket client that connects to Ani's FastAPI backend for real-time session communication.

1. src/lib/ws/ResonanceSocket.ts — WebSocket client class:

   class ResonanceSocket {
     private ws: WebSocket | null = null;
     private listeners: Map<string, Set<(data: any) => void>> = new Map();
     private reconnectAttempts = 0;
     private maxReconnects = 5;
     private pingInterval: NodeJS.Timer | null = null;
     
     constructor(private baseUrl: string) {}
     
     connect(sessionId: string): void
       - Opens WebSocket to: `${this.baseUrl}/ws/session/${sessionId}`
       - On open: start sending ping every 30 seconds
       - On message: parse JSON, route to listeners by message.type
       - On close: attempt reconnect with exponential backoff (1s, 2s, 4s, 8s, 16s)
       - On error: emit to 'error' listeners
     
     disconnect(): void
       - Send { type: "stop_session", data: {} }
       - Clear ping interval
       - Close WebSocket cleanly (code 1000)
       - Reset reconnect counter
     
     send(type: string, data: object): void
       - Send JSON { type, data } if connected
       - Queue messages if not yet connected (flush on open)
     
     on(type: string, callback: (data: any) => void): () => void
       - Register a listener for a message type
       - Returns unsubscribe function
     
     off(type: string, callback: (data: any) => void): void
     
     get isConnected(): boolean
     get connectionState(): 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
   }
   
   Export a singleton: export const resonanceSocket = new ResonanceSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000')

2. src/hooks/useResonanceSocket.ts — React hook:

   function useResonanceSocket() {
     Returns: {
       connectionState: 'connecting' | 'connected' | 'reconnecting' | 'disconnected',
       isConnected: boolean,
       
       // Typed event listeners that auto-cleanup on unmount
       onBiometricUpdate: (cb: (data: BiometricSnapshot) => void) => void,
       onMoodUpdate: (cb: (data: MoodState) => void) => void,
       onTrackReady: (cb: (data: TrackReadyPayload) => void) => void,
       onSessionStatus: (cb: (data: SessionStatusPayload) => void) => void,
       onError: (cb: (data: ErrorPayload) => void) => void,
       
       // Actions
       startSession: (target: TargetMood, prefs: UserPreferences) => void,
       stopSession: () => void,
       updateTarget: (target: TargetMood) => void,
     }
   }
   
   Use useEffect for cleanup — disconnect on unmount.
   Use useRef for the socket instance to avoid re-renders.
   Use useState for connectionState.

3. src/types/ws.ts — WebSocket message types:

   // Server -> Client
   interface BiometricUpdateMessage { type: 'biometric_update', data: BiometricSnapshot }
   interface MoodUpdateMessage { type: 'mood_update', data: MoodState }
   interface TrackReadyMessage { type: 'track_ready', data: { audio_url: string, prompt_used: string, params: MusicParams, duration_seconds: number, track_number: number } }
   interface SessionStatusMessage { type: 'session_status', data: { status: SessionState, message: string, elapsed_seconds: number, tracks_generated: number } }
   interface ErrorMessage { type: 'error', data: { code: string, message: string, recoverable: boolean } }
   
   type ServerMessage = BiometricUpdateMessage | MoodUpdateMessage | TrackReadyMessage | SessionStatusMessage | ErrorMessage
   
   // Client -> Server  
   interface StartSessionMessage { type: 'start_session', data: { target_mood: TargetMood, preferences: UserPreferences } }
   interface StopSessionMessage { type: 'stop_session', data: {} }
   interface UpdateTargetMessage { type: 'update_target', data: { target_mood: TargetMood } }
   interface PingMessage { type: 'ping', data: {} }
   
   type ClientMessage = StartSessionMessage | StopSessionMessage | UpdateTargetMessage | PingMessage

   type SessionState = 'active' | 'generating' | 'target_approaching' | 'target_reached' | 'complete' | 'error'

The WebSocket URL comes from NEXT_PUBLIC_WS_URL env variable.
Default to ws://localhost:8000 for local dev.
```

### K12b. Demo Mode WebSocket Simulator

```
Build a mock WebSocket server that runs entirely in the browser for demo mode:

src/lib/ws/MockResonanceSocket.ts:

This class has the EXACT same interface as ResonanceSocket but doesn't open a real WebSocket.
Instead, it simulates the server's behavior locally.

class MockResonanceSocket implements the same interface as ResonanceSocket {
  
  connect(sessionId: string): void
    - Immediately set state to 'connected'
    - Fire listeners as if connected
  
  When startSession is called with a target mood:
    - Immediately emit session_status: { status: 'active' }
    - After 2 seconds: emit first biometric_update with a "stressed" baseline reading
    - After 3 seconds: emit mood_update for Q2 (stressed)
    - After 5 seconds: emit session_status: { status: 'generating' }
    - After 8 seconds: emit track_ready with a placeholder audio URL
    - Then every 60 seconds for 5 minutes:
      1. Generate next biometric reading using sigmoid interpolation toward target
         Add Gaussian noise (Math.random() * 0.05) for realism
      2. Emit biometric_update
      3. Emit mood_update (recalculated from biometrics)
      4. Every 3rd reading: emit session_status: { status: 'generating' } then after 3s emit track_ready
    - When valence/arousal within 0.1 of target for 2 consecutive readings:
      Emit session_status: { status: 'target_reached' }
    - After 5 minutes total: emit session_status: { status: 'complete' }
    
  Use setTimeout/setInterval for timing. Clean up all timers on disconnect.
}

In src/lib/ws/index.ts:
  - Check env: if NEXT_PUBLIC_DEMO_MODE === 'true', export MockResonanceSocket as the socket
  - Otherwise export real ResonanceSocket
  - The hook (useResonanceSocket) doesn't need to know which one it's using

This mock is CRITICAL. The entire demo works without Ani's backend if this is solid.
The sigmoid interpolation from current to target should take 4-5 minutes and look natural.
```

### K13-NEW. Session Page (Full Real-Time Wiring)

```
Build the complete session experience page using WebSocket data:

src/app/session/page.tsx — complete rewrite using WebSocket:

1. Session flow:
   - User arrives from dashboard after selecting target mood
   - Read target mood from URL params or React context
   - Page shows "Connecting..." while WebSocket connects
   - On connect: send start_session message with target + preferences
   - Listen for all server messages and update UI in real-time

2. State management (useReducer recommended):
   
   State shape:
   {
     connectionState: string,
     sessionStatus: SessionState,
     statusMessage: string,
     currentBiometrics: BiometricSnapshot | null,
     currentMood: MoodState | null,
     targetMood: TargetMood,
     moodHistory: MoodState[],  // for circumplex trail
     currentTrack: { audio_url, params, track_number } | null,
     tracksGenerated: number,
     elapsedSeconds: number,
     error: { code, message, recoverable } | null,
   }
   
   Reducer handles each WebSocket message type and updates relevant state.

3. UI layout (mobile-first, single scroll):

   TOP: Connection indicator dot (green = connected, yellow = reconnecting, red = disconnected)
   
   SECTION 1: Circumplex Map (takes moodHistory + targetMood as props)
   - Current dot animates in real-time as mood_update arrives
   - Trail shows last 10 mood readings
   - Target dot stays fixed (unless user calls updateTarget)
   
   SECTION 2: Live Stats Bar (horizontal, compact)
   - HRV: 42ms | HR: 68bpm | Stress: 72
   - Updates when biometric_update arrives
   - Subtle flash animation on update
   
   SECTION 3: Session Status
   - Dynamic message from sessionStatus.message
   - "Listening to your body..." / "Generating your next track..." / "You're almost there..."
   - Progress indicator: elapsed time + tracks generated
   
   SECTION 4: Audio Player (fixed at bottom, above nav)
   - Shows when track_ready arrives
   - Crossfades automatically when new track_ready arrives
   - Uses the AudioEngine from K8
   
   SECTION 5: "End Session" button
   - Sends stop_session via WebSocket
   - Shows session summary (time, tracks, mood journey) on completion

4. Handle edge cases:
   - WebSocket disconnects mid-session: show reconnecting UI, auto-resume on reconnect
   - Error messages: show toast notification, don't crash the session
   - Track generation fails: show "Retrying..." and keep current track playing
   - Session complete: celebration animation (subtle green glow on circumplex, "Target Reached!")

5. Handle the "generating" state specifically:
   - When session_status.status === 'generating':
     Show an animated waveform/equalizer placeholder in the audio player area
     Pulse the status message
   - When track_ready arrives:
     Crossfade from current track (or silence) to new track
     Update track info display
```

### K-ENV. Environment Variables

```
Update .env.local with WebSocket configuration:

# Backend WebSocket URL (Ani's FastAPI server)
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Demo mode (uses MockResonanceSocket, no real backend needed)
NEXT_PUBLIC_DEMO_MODE=true

# Backend REST URL (same server, different protocol)  
NEXT_PUBLIC_API_URL=http://localhost:8000

# Lyria (only needed if generating client-side as fallback)
LYRIA_API_KEY=

Update src/lib/config.ts:
export const config = {
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  isDemoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
}

For production on Vercel, set:
  NEXT_PUBLIC_WS_URL=wss://<ani-railway-url>   (note: wss:// not ws:// for production)
  NEXT_PUBLIC_API_URL=https://<ani-railway-url>
  NEXT_PUBLIC_DEMO_MODE=false
```
