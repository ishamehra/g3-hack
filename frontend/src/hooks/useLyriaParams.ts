"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { config } from "@/lib/config";
import type { LyriaParamsRow } from "@/types";

/**
 * Poll the backend /api/session/state endpoint as a fallback,
 * mapping its response shape into a LyriaParamsRow.
 */
function mapApiState(sessionId: string, data: Record<string, unknown>): LyriaParamsRow {
  const lp = data.lyria_params as Record<string, unknown> | undefined;
  const es = data.emotional_state as Record<string, unknown> | undefined;
  return {
    session_id: sessionId,
    weighted_prompts: (data.prompts ?? []) as LyriaParamsRow["weighted_prompts"],
    bpm: (lp?.bpm as number) ?? 0,
    density: (lp?.density as number) ?? 0,
    brightness: (lp?.brightness as number) ?? 0,
    scale: (lp?.scale as LyriaParamsRow["scale"]) ?? "C_MAJOR_A_MINOR",
    guidance: (lp?.guidance as number) ?? 0,
    temperature: (lp?.temperature as number) ?? 0,
    mood_label: (lp?.mood_label as string) ?? "",
    instruments: (lp?.instruments as string[]) ?? [],
    narration: (data.narration as string) ?? "",
    emotional_state: {
      valence: (es?.valence as number) ?? 0.5,
      arousal: (es?.arousal as number) ?? 0.5,
      quadrant: (es?.quadrant as LyriaParamsRow["emotional_state"]["quadrant"]) ?? "Q4",
      label: (es?.label as string) ?? "",
    },
    biometrics: {
      hr: null,
      hrv: null,
      stress_pct: null,
      sleep_score: null,
      readiness_score: null,
    },
    circadian_phase: "",
    cycle_phase: null,
    weather: null,
    updated_at: new Date().toISOString(),
  };
}

export function useLyriaParams(sessionId: string | null) {
  const [params, setParams] = useState<LyriaParamsRow | null>(null);
  const gotSupabaseData = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setParams(null);
      gotSupabaseData.current = false;
      return;
    }

    gotSupabaseData.current = false;

    // --- Supabase: fetch initial + subscribe to realtime ---
    supabase
      .from("lyria_params")
      .select("*")
      .eq("session_id", sessionId)
      .single()
      .then(({ data }) => {
        if (data) {
          gotSupabaseData.current = true;
          setParams(data as LyriaParamsRow);
        }
      });

    const channel = supabase
      .channel(`lyria_params:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lyria_params",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          gotSupabaseData.current = true;
          setParams(payload.new as LyriaParamsRow);
        }
      )
      .subscribe();

    // --- Fallback: poll /api/session/state every 5s ---
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const pollApi = async () => {
      // Stop polling once Supabase is delivering data
      if (gotSupabaseData.current) {
        if (pollTimer) clearInterval(pollTimer);
        return;
      }
      try {
        const res = await fetch(`${config.apiUrl}/api/session/state`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.lyria_params) {
          setParams(mapApiState(sessionId, data));
        }
      } catch {
        // ignore poll errors
      }
    };

    // Initial poll after 2s (give Supabase a chance first)
    const initialTimeout = setTimeout(() => {
      pollApi();
      pollTimer = setInterval(pollApi, 5000);
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(initialTimeout);
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [sessionId]);

  return params;
}
